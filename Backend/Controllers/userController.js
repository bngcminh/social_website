import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Like from '../Models/Like.js'
import Follow from '../Models/Follow.js';
import Comment from '../Models/Comment.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const createPost = async function(req, rep) {
    try {
        const parts = req.parts();
        const data = { media: [] };

        for await (const part of parts){
            if (part.type === 'field'){
                data[part.fieldname] = part.value;
            }

            if (part.type === 'file'){
                const uploadDir = path.join(__dirname, '../../Frontend/public/upload');
                const filename = `${Date.now()}-${part.filename}`;
                const upload = path.join(uploadDir, filename);

                await pipeline(part.file, fs.createWriteStream(upload));

                data.media.push({
                    url: `/upload/${filename}`,
                    type: part.mimetype.startsWith('image/') ? 'image' : 'video'
                });
            }
        }

        if (!data.content){
            return rep.code(400).send('Nội dung bài viết không được để trống!');
        }

        const post = await Post.create({
            author: req.user.id,
            content: data.content.trim(),
            media: data.media
        });

        return rep.code(201).send({
            message: 'Tạo bài viết thành công!',
            post
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi khi tạo bài viết!');
    }
};

export const editPost = async function(req, rep){
    try{
        const postId = req.params.postId;
        const post = await Post.findById(postId);

        if(!post){
            return rep.code(403).send('Không tìm thấy bài viết');
        }

        if(post.author.toString() !== req.user.id){
            return rep.code(400).send('Bạn không thể chỉnh sửa bài viết này');
        }

        const parts = req.parts();
        const data = {
            content: post.content,
            media: []
        }

        for await(const part of parts){
            if(part.type === 'field'){
                data[part.fieldname] = part.value;
            }
            if(part.type === 'file'){
                const uploadDir = path.join(__dirname, '../../Frontend/public/upload');
                const filename = `${Date.now()}-${part.filename}`;
                const upload = path.join(uploadDir, filename);

                await pipeline(part.file, fs.createWriteStream(upload));

                data.media.push({
                    url: `/upload/${filename}`,
                    type: part.mimetype.startsWith('image/') ? 'image' : 'video'
                });
            }
        }

        if(!data.content){
            return rep.code(400).send('Nội dung bài viết không được để trống!');
        }

        post.content = data.content.trim();

        if(data.media.length > 0){
            post.media = data.media;
        }

        post.isEdited = true;
        await post.save();

        return rep.send({
            message: 'Chỉnh sửa bài viết thành công',
            post
        })
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình chỉnh sửa bài viết');
    }
}

export const deletePost = async function(req, rep){
    try{
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if(post.author.toString() !== req.user.id){
            rep.code(403).send('Bạn không có quyền chỉnh sửa bài viết này');
        }
        await Post.deleteOne({ _id: postId });
        return rep.send('Xóa bài viết thành công');
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình xóa bài viết');
    }
}

export const getSuggestions = async function(req, rep){
    try {
        // Try to get current user if logged in
        let currentUserId = null;
        const token = req.cookies?.token;
        if(token){
            try {
                const decoded = req.server.jwt.verify(token);
                currentUserId = decoded.id;
            } catch(err) {
                // Token invalid, ignore
            }
        }
        
        // Get all users, optionally exclude current user
        const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
        const users = await User.find(query)
            .select('username avatar')
            .limit(100);
        
        if(users.length === 0){
            return rep.send({
                success: true,
                data: []
            });
        }
        
        // Shuffle and get 3 random users
        const shuffled = users.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        // Check follow status for each user
        const data = [];
        for(const u of shuffled){
            let following = false;
            if(currentUserId){
                const followRecord = await Follow.findOne({
                    follower: currentUserId,
                    following: u._id
                });
                following = !!followRecord;
            }
            data.push({
                _id: u._id,
                name: u.username,
                handle: '@' + u.username,
                init: u.username.substring(0, 2).toUpperCase(),
                color: ['#7c3aed', '#db2777', '#059669', '#1d9bf0', '#ea580c'][Math.floor(Math.random() * 5)],
                following: following
            });
        }
        
        return rep.send({
            success: true,
            data: data
        });
    } catch (err) {
        console.log('Lỗi getSuggestions:', err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi lấy gợi ý'
        });
    }
}

export const toggleFollow = async function(req, rep){
    try {
        const currentUserId = req.user.id;
        const targetUserId = req.params.userId;
        
        // Không cho tự follow
        if(currentUserId === targetUserId){
            return rep.code(400).send('Bạn không thể theo dõi chính mình');
        }
        
        // Check nếu đã follow
        const existing = await Follow.findOne({
            follower: currentUserId,
            following: targetUserId
        });
        
        if(existing){
            // Unfollow
            await Follow.deleteOne({
                follower: currentUserId,
                following: targetUserId
            });
            return rep.send({
                success: true,
                following: false,
                message: 'Đã bỏ theo dõi'
            });
        } else {
            // Follow
            await Follow.create({
                follower: currentUserId,
                following: targetUserId
            });
            return rep.send({
                success: true,
                following: true,
                message: 'Đã theo dõi'
            });
        }
    } catch(err){
        console.log('Lỗi toggleFollow:', err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi theo dõi/bỏ theo dõi'
        });
    }
}

// Toggle like a post
export const toggleLike = async function(req, rep){
    try {
        const currentUserId = req.user.id;
        const postId = req.params.postId;
        
        console.log('DEBUG toggleLike - postId:', postId, 'type:', typeof postId);
        
        // Check if post exists
        const post = await Post.findById(postId);
        if(!post){
            console.log('Post not found for ID:', postId);
            return rep.code(404).send({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }
        
        // Check if already liked
        const existing = await Like.findOne({
            user: currentUserId,
            post: postId
        });
        
        if(existing){
            // Unlike
            await Like.deleteOne({
                user: currentUserId,
                post: postId
            });
            post.likeCount = Math.max(0, post.likeCount - 1);
            await post.save();
            
            return rep.send({
                success: true,
                liked: false,
                likeCount: post.likeCount,
                message: 'Đã bỏ thích'
            });
        } else {
            // Like
            await Like.create({
                user: currentUserId,
                post: postId
            });
            post.likeCount += 1;
            await post.save();
            
            return rep.send({
                success: true,
                liked: true,
                likeCount: post.likeCount,
                message: 'Đã thích bài viết'
            });
        }
    } catch(err){
        console.log('Lỗi toggleLike:', err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi thích bài viết'
        });
    }
}

// Toggle retweet a post
export const toggleRetweet = async function(req, rep){
    try {
        const currentUserId = req.user.id;
        const postId = req.params.postId;
        
        // Check if post exists
        const post = await Post.findById(postId);
        if(!post){
            return rep.code(404).send({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }
        
        // Check if already retweeted
        const existing = await Post.findOne({
            rePostOf: postId,
            author: currentUserId
        });
        
        if(existing){
            // Un-retweet (delete the repost)
            await Post.deleteOne({ _id: existing._id });
            post.retpostCount = Math.max(0, post.retpostCount - 1);
            await post.save();
            
            return rep.send({
                success: true,
                retweeted: false,
                retpostCount: post.retpostCount,
                message: 'Đã bỏ chia sẻ'
            });
        } else {
            // Retweet (create a new post that references original)
            const repost = await Post.create({
                content: `Chia sẻ từ @${post.author.username}`,
                author: currentUserId,
                rePostOf: postId
            });
            post.retpostCount += 1;
            await post.save();
            
            return rep.send({
                success: true,
                retweeted: true,
                retpostCount: post.retpostCount,
                message: 'Đã chia sẻ bài viết'
            });
        }
    } catch(err){
        console.log('Lỗi toggleRetweet:', err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi chia sẻ bài viết'
        });
    }
}

// Add reply/comment to a post
export const addReply = async function(req, rep){
    try {
        const currentUserId = req.user.id;
        const postId = req.params.postId;
        const { content } = req.body;
        
        if(!content || content.trim().length === 0){
            return rep.code(400).send({
                success: false,
                message: 'Nội dung trả lời không được để trống'
            });
        }
        
        // Check if post exists
        const post = await Post.findById(postId).populate('author');
        if(!post){
            return rep.code(404).send({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }
        
        // Create comment
        const comment = await Comment.create({
            content: content.trim(),
            author: currentUserId,
            post: postId
        });
        
        // Increase comment count
        post.commentCount += 1;
        await post.save();
        
        return rep.code(201).send({
            success: true,
            comment,
            commentCount: post.commentCount,
            message: 'Đã thêm trả lời'
        });
    } catch(err){
        console.log('Lỗi addReply:', err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi thêm trả lời'
        });
    }
}

// Get liked posts
export const getLikedPosts = async function(req, rep){
    try {
        const userId = req.user.id;
        
        // Get all likes by user, sorted newest first
        const likes = await Like.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'post',
                populate: { path: 'author' }
            });
        
        // Extract posts from likes
        const posts = likes.map(like => like.post).filter(post => post !== null);
        
        return rep.code(200).send({
            success: true,
            posts
        });
    } catch(err){
        console.log('Lỗi getLikedPosts:', err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi lấy danh sách thích'
        });
    }
}