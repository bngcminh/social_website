import User from '../Models/User.js';
import Post from '../Models/Post.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

