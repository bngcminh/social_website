import Like from '../Models/Like.js';
import Comment from '../Models/Comment.js';
import Post from '../Models/Post.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const __dirname = path.resolve();

export const likePost = async function(req, rep){
    try{
        const postId = req.params.postId;
        const postExist = await Post.findById(postId);

        if(!postExist){
            return rep.code(404).send('Khong tim thay bai viet');
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
            return rep.code(404).send('Khong tim thay bai viet');
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

        rep.send({
            message: 'Tạo bình luận thành công',
            comment
        })
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình tạo bình luận');
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
        await content.save();

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
            $or: {
                _id: commentId,
                parentComment: commentId 
            }
        });

        await Post.findByIdAndUpdate(
            commentId,
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

export const rePost = async function(req, rep){
    try{
        const postId = req.params.postId;
        const originPost = await Post.findById(postId);

        if(originPost.rePostOf){
            rep.code(400).sned('Chỉ có thể đăng lại bài viết 1 lần');
        }

        const existRepost = await Post.findOne({
            author: req.user.id,
            rePostOf: postId
        });

        if(existRepost){
            await existRepost.deleteOne();
            const post = await Post.findByIdAndUpdate(
                postId,
                { $inc: { repostCount: -1 } },
                { new: true }
            );
            return rep.send({
                reposted: false,
                repostCount: post.repostCount
            });
        }

        const content = req.body?.content?.trim();
        const repost = await Post.create({
            author: req.user.id,
            content,
            rePostOf: postId,
            media: [],
        });

        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { repostCount: 1 } },
            { new: true }
        );

        return rep.send({
            message: 'Đăng lại bài viết thành công',
            reposted: true,
            repostCount: post.repostCount,
            repost
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình đăng lại bài viết');
    }
}