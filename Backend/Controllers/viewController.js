import User from '../Models/User.js';
import Follow from '../Models/Follow.js';
import Post from '../Models/Post.js';
import Like from '../Models/Like.js';
import Comment from '../Models/Comment.js';
import Notifcation from '../Models/Notification.js';
import Coversation from '../Models/Coversation.js';

export const getHome = async function(req, rep){
    try{
        const posts = await Post.find().populate('author', 'username avatar').sort({ createdAt: -1 });
        return rep.view('home.ejs', { posts });
    } catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy trang chủ');
    }
}

export const getProfile = async function(req, rep){
    try{
        const { username } = req.params;
        
        // Find user by username
        const profileUser = await User.findOne({ username }).select('-password');
        
        if (!profileUser) {
            return rep.view('404.ejs', { message: 'Người dùng không tồn tại' });
        }

        // Get user's posts
        const posts = await Post.find({ author: profileUser._id }).populate('author', 'username avatar').sort({ createdAt: -1 });
        
        console.log('DEBUG Profile posts:', posts.length, 'First post ID:', posts[0]?._id, 'Type:', typeof posts[0]?._id);

        // Get following and followers count
        const followingCount = await Follow.countDocuments({ follower: profileUser._id });
        const followersCount = await Follow.countDocuments({ following: profileUser._id });

        // Check if current user is following this user
        let isFollowing = false;
        let currentUser = null;

        // Check token to get current user
        const token = req.cookies.token;
        if (token) {
            try {
                const decoded = await req.server.jwt.verify(token);
                currentUser = await User.findById(decoded.id).select('-password');
                
                const followRecord = await Follow.findOne({ 
                    follower: decoded.id, 
                    following: profileUser._id 
                });
                isFollowing = !!followRecord;
            } catch (err) {
                console.log('Token verification failed:', err.message);
            }
        }

        const isOwnProfile = currentUser && currentUser._id.toString() === profileUser._id.toString();

        return rep.view('profile.ejs', {
            profileUser: {
                ...profileUser.toObject(),
                followingCount,
                followersCount
            },
            posts: posts.map(p => p.toObject()),
            isFollowing,
            user: currentUser ? currentUser.toObject() : null,
            isOwnProfile
        });
    } catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình lấy trang cá nhân');
    }
}