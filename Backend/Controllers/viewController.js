import User from '../Models/User.js';
import Follow from '../Models/Follow.js';
import Post from '../Models/Post.js';
import Like from '../Models/Like.js';
import Comment from '../Models/Comment.js';
import Notifcation from '../Models/Notification.js';
import Coversation from '../Models/Coversation.js';

function formPostData(){
    return {
        id: Post._id,
        content: Post.content,
        media: Post.media,
        author: Post.author,
        likeCount: Post.likeCount,
        commentCount: Post.commentCount,
        viewsCount: Post.viewsCount,
        repostCount: Post.repostCount,
        rePostOf: Post.rePostOf,
        isEdited: Post.isEdited,
        createAt: Post.createAt,
        updateAt: Post.updateAt
    }
}

export const getHome = async function(req, rep){
    try{
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '20', 10), 1), 50);
        const [posts, totalPosts] = await Promise.all([
            Post.find()
                .populate('author', 'username avatar')
                .populate({
                    path: 'rePostOf',
                    select: 'content media author likeCount commentCount viewsCount repostCount createAt',
                    populate: {
                        path: 'author',
                        select: 'username avatar'
                    }
                })
            .sort({ createAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit),
            Post.countDocuments()
        ]);

        rep.send({
            page,
            limit,
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
            posts: posts.map(formPostData)
        })
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy các bài viết');
    }
}

export const getPostDetail = async function(req, rep){
    try{
        const postId = req.params.postId;
        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { viewsCount: 1 } },
            { new: true }
        ).populate('author', 'username avatar').populate({ 
            path: 'rePostOf', 
            select: 'content media author likeCount commentCount viewsCount retpostCount createdAt', 
            populate: { path: 'author', select: 'username avatar isVerified' } 
        });
        return rep.send({post: formPostData(post)})
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy bài viết này');
    }
}

export const getProfile = async function(req, rep){
    try{
        const getInfor = await User.findById(req.user.id);
        rep.send({ getInfor }); 
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình lấy trang cá nhân')
    }
}
