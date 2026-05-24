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
        return rep.code(500).send('Có lỗi trong quá trình tạo bài viết');
    }
}