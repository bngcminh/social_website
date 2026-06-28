import User from '../Models/User.js';
import Conversation from '../Models/Coversation.js'
import Follow from '../Models/Follow.js';
import Post from '../Models/Post.js';
import Notification from '../Models/Notification.js';

function formPostData(post){
    return {
        id: post._id,
        _id: post._id,
        content: post.content,
        media: post.media,
        author: post.author,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        viewsCount: post.viewsCount,
        viewCount: post.viewsCount,
        repostCount: post.repostCount,
        repostOf: post.repostOf,
        isEdited: post.isEdited,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
    }
}

async function getCurrentUser(req){
    try{
        const token = req.cookies?.token;

        if(!token && !req.user?.id){
            return null;
        }

        const userId = req.user?.id || req.server.jwt.verify(token).id;
        return await User.findById(userId).select('-password');
    }catch(err){
        return null;
    }
}

export const getAuth = async function(req, rep){
    try{
        return rep.view('auth.ejs');
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình hiển thị trang đăng nhập');
    }
}

export const getSearchPage = async function(req, rep){
    try{
        const user = await getCurrentUser(req);
        if(!user){
            return rep.redirect('/auth');
        }

        return rep.view('search.ejs', {
            user,
            keyword: req.query.q || ''
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình hiển thị trang tìm kiếm');
    }
}

export const getMessage = async function(req, rep){
    try{
        const user = await getCurrentUser(req);
        if(!user){
            return rep.redirect('/auth');
        }

        const conversations = await Conversation.find({
            participants: user._id
        })
        .populate('participants', 'username avatar')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username avatar'
            }
        })
        .sort({ updatedAt: -1 });

        return rep.view('messages.ejs', { 
            user,
            conversations
        });
    }catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình hiển thị trang tin nhắn');
    }
}

export const getNotificationPage = async function(req, rep){
    try{
        const user = await getCurrentUser(req);
        if(!user){
            return rep.redirect('/auth');
        }

        const unreadCount = await Notification.countDocuments({
            recipient: user._id,
            isRead: false
        });

        return rep.view('notifications.ejs', {
            user,
            unreadCount
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình hiển thị trang thông báo');
    }
}

export const getHome = async function(req, rep){
    try{
        const user = await getCurrentUser(req);
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '20', 10), 1), 50);

        const [posts, totalPosts] = await Promise.all([
            Post.find()
                .populate('author', 'username avatar')
                .populate({
                    path: 'rePostOf',
                    select: 'content media author likeCount commentCount viewsCount repostCount createdAt',
                    populate: {
                        path: 'author',
                        select: 'username avatar'
                    }
                })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Post.countDocuments()
        ]);

        return rep.view('home.ejs', {
            user,
            page,
            limit,
            totalPosts,
            totalPages: Math.ceil(totalPosts / limit),
            posts: posts.map(formPostData)
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Co loi trong qua trinh lay cac bai viet');
    }
}

export const getHomePosts = async function(req, rep){
    try{
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '20', 10), 1), 50);
        const [posts, totalPosts] = await Promise.all([
            Post.find()
                .populate('author', 'username avatar')
                .populate({
                    path: 'rePostOf',
                    select: 'content media author likeCount commentCount viewsCount repostCount createdAt',
                    populate: {
                        path: 'author',
                        select: 'username avatar'
                    }
                })
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Post.countDocuments()
        ]);

        return rep.send({
            data: posts.map(formPostData),
            success: true
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy các bài viết');
    }
}

export const getFollowingPosts = async function(req, rep){
    try{
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '20', 10), 1), 50);

        const followingList = await Follow.find({
            follower: req.user.id
        }).select('following');

        const followingIds = followingList.map(function(item){
            return item.following;
        });

        if(followingIds.length === 0){
            return rep.send({
                success: false,
                data: [],
                message: 'Bạn chưa theo dõi ai'
            });
        }

        const posts = await Post.find({
            author: { $in: followingIds }
        })
        .populate('author', 'username avatar')
        .populate({
            path: 'rePostOf',
            select: 'content media author likeCount commentCount viewsCount repostCount createdAt',
            populate: {
                path: 'author',
                select: 'username avatar'
            }
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

        return rep.send({
            success: true,
            data: posts.map(formPostData)
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi lấy bài viết đang theo dõi'
        });
    }
}

export const getPostDetail = async function(req, rep){
    try{
        const postId = req.params.postId;
        const user = await getCurrentUser(req);

        const post = await Post.findByIdAndUpdate(
            postId,
            { $inc: { viewsCount: 1 } },
            { new: true }
        )
        .populate('author', 'username avatar')
        .populate({
            path: 'rePostOf',
            select: 'content media author likeCount commentCount viewsCount repostCount createdAt',
            populate: {
                path: 'author',
                select: 'username avatar'
            }
        });

        if(!post){
            return rep.code(404).send('Khong tim thay bai viet');
        }

        return rep.view('post.ejs', {
            user,
            post: formPostData(post)
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Co loi trong qua trinh lay bai viet nay');
    }
}
