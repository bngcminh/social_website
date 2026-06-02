import Post from '../Models/Post.js';
import User from '../Models/User.js';

export const getPosts = async function(req, rep) {
    try {
        const posts = await Post.find()
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(20);
        
        return rep.send({
            success: true,
            data: posts
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi lấy bài viết'
        });
    }
}

export const getPostById = async function(req, rep) {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId)
            .populate('author', 'username avatar');
        
        if (!post) {
            return rep.code(404).send({
                success: false,
                message: 'Không tìm thấy bài viết'
            });
        }
        
        return rep.send({
            success: true,
            data: post
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi lấy bài viết'
        });
    }
}
