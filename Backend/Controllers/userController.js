import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Like from '../Models/Like.js'
import Follow from '../Models/Follow.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const __dirname = path.resolve();

export const createPost = async function(req, rep){
    try{
        const parts = req.parts();
        const data = { media: [] };
        for await(const part of parts){
            if(part.type === 'field'){
                data[part.fieldname] = part.value
            }

            if(part.type === 'file'){
                const upload = path.join(__dirname, '../public/upload', part.filename);
                await pipeline(part.file, fs.createWriteStream(upload));
                data.media.push({
                    url: `${part.filename}`,
                    type: part.mimetype.startsWith('image/') ? 'image' : 'video'
                });
            }
        }

        await Post.create({
            author: req.user.id,
            content: data.content,
            media: data.media
        })

        rep.send('Tạo bài viết thành công!');
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi khi tạo bài viết!');
    }
}