import Like from '../Models/Like.js';
import Comment from '../Models/Comment.js';
import Post from '../Models/Post.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createNotification } from './notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const likePost = async function(req, rep){
    try{
        const postId = req.params.postId;
        const postExist = await Post.findById(postId);

        if(!postExist){
            return rep.code(404).send('Không tìm thấy bài viết');
        }

        const likeExist = await Like.findOne({
            user: req.user.id,
            post: postId
        });

        if(likeExist){
            await likeExist.deleteOne();
            const post = await Post.findByIdAndUpdate(
                postId,
                { $inc: { likeCount: -1 } },
                { new: true }
            );

            return rep.send({
                liked: false,
                likeCount: post.likeCount
            });
        }

        await Like.create({
            user: req.user.id,
            post: postId
        });

        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { likeCount: 1 } },
            { new: true }
        );

        await createNotification({
            recipient: post.author,
            sender: req.user.id,
            type: 'like',
            post: postId,
            url: `/post/${postId}`
        });

        return rep.send({
            liked: true,
            likeCount: post.likeCount
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình thích bài viết');
    }
}

export const createComment = async function(req, rep){
    try{
        const postId = req.params.postId;
        const post = await Post.findById(postId);

        if(!post){
            return rep.code(404).send('Không tìm thấy bài viết');
        }

        const parts = req.parts();
        const data = {};
        for await(const part of parts){
            if(part.type === 'field'){
                data[part.fieldname] = part.value;
            }
            if(part.type === 'file'){
                const uploadDir = path.join(__dirname, '../../Frontend/public/upload');
                const filename = `${Date.now()}-${part.filename}`;
                const upload = path.join(uploadDir, filename);

                await pipeline(part.file, fs.createWriteStream(upload));
                data.image = `/upload/${filename}`
            }
        }

        const content = data.content?.trim() ||'';
        if(!content && !data.image){
            return rep.code(400).send('Bình luận phải có chữ hoặc ảnh');
        }

        const comment = await Comment.create({
            author: req.user.id,
            post: postId,
            content,
            image: data.image || '',
            parentComment: data.parentComment
        });

        await Post.findByIdAndUpdate(
            postId,
            { $inc: { commentCount: 1 } },
            { new: true }
        );

        await createNotification({
            recipient: post.author,
            sender: req.user.id,
            type: 'comment',
            post: postId,
            comment: comment._id,
            url: `/post/${postId}`
        });

        rep.send({
            message: 'Tạo bình luận thành công',
            comment
        })
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình tạo bình luận');
    }
}

export const getComments = async function(req, rep){
    try{
        const postId = req.params.postId;
        const comments = await Comment.find({ post: postId, parentComment: null })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 });

        return rep.send({
            comments
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy bình luận');
    }
}

export const editComment = async function(req, rep){
    try{
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);

        if(comment.author.toString() !== req.user.id){
            return rep.code(403).send('Bạn không có quyền chỉnh sửa comment này');
        }

        const parts = req.parts();
        const data = {};
        for await(const part of parts){
            if(part.type === 'field'){
                data[part.fieldname] = part.value;
            }
            if(part.type === 'file'){
                const uploadDir = path.join(__dirname, '../../Frontend/public/upload');
                const filename = `${Date.now()}-${part.filename}`;
                const upload = path.join(uploadDir, filename);

                await pipeline(part.file, fs.createWriteStream(upload));
                data.image = `/upload/${part.filename}`;
            }
        }

        const content = data.content !== undefined ? data.content.trim() : comment.content;
        const image =  data.image || comment.image;

        if(!content && !image){
            return rep.code(400).send('Bình luận phải có chữ hoặc ảnh')
        }

        comment.content = content;
        comment.image = image;
        await comment.save();

        return rep.send({
            message: 'Chỉnh sửa bình luận thành công',
            comment
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình sửa bình luận');
    }
}


export const deleteComment = async function(req, rep){
    try{
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);

        if(comment.author.toString() !== req.user.id){
            return rep.code(403).send('Bạn không có quyền xóa bình luận này');
        }

        const del = await Comment.deleteMany({
            $or: [
                { _id: commentId },
                { parentComment: commentId }
            ]
        });

        await Post.findByIdAndUpdate(
            comment.post,
            { $inc: { commentCount: -del.deletedCount } },
            { new: true }
        );

        return rep.send({
            message: 'Xóa bình luận thành công',
            deletedCount: del.deletedCount
        })
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình xóa bình luận');
    }
}

export const toggleRetweet = async function(req, rep){
    try{
        const currentUserId = req.user.id;
        const postId = req.params.postId;
        const post = await Post.findById(postId).populate('author', 'username');

        if(!post){
            return rep.code(404).send({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }

        const existing = await Post.findOne({
            rePostOf: postId,
            author: currentUserId
        });

        if(existing){
            await Post.deleteOne({ _id: existing._id });
            post.repostCount = Math.max(0, (post.repostCount || 0) - 1);
            await post.save();

            return rep.send({
                success: true,
                retweeted: false,
                repostCount: post.repostCount,
                message: 'Đã bỏ chia sẻ'
            });
        }

        await Post.create({
            content: `Chia se tu @${post.author.username}`,
            author: currentUserId,
            rePostOf: postId
        });

        post.repostCount = (post.repostCount || 0) + 1;
        await post.save();

        return rep.send({
            success: true,
            retweeted: true,
            repostCount: post.repostCount,
            message: 'Đã chia sẻ bài viết'
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi đăng lại bài viết'
        });
    }
}
