import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Follow from '../Models/Follow.js';
import * as viewController from '../Controllers/viewController.js';
import { authentication } from '../Middlewares/authentication.js';

export function viewRoute(fastify, options){
    fastify.get('/', async (req, rep) => {
        try {
            const token = req.cookies.token;
            let user = null;

            if (token) {
                try {
                    // Verify token directly from cookie
                    const decoded = await fastify.jwt.verify(token);
                    user = await User.findById(decoded.id).select('-password');
                } catch (err) {
                    console.log('Token verification failed:', err.message);
                }
            }

            return rep.view('home.ejs', { user });
        } catch (err) {
            console.log(err);
            return rep.view('home.ejs', { user: null });
        }
    })

    fastify.get('/auth', (req, rep) => {
        return rep.view('auth.ejs');
    })

    fastify.get('/profile/:username', async (req, rep) => {
        try {
            const { username } = req.params;
            
            // Find user by username
            const profileUser = await User.findOne({ username }).select('-password');
            
            if (!profileUser) {
                return rep.view('404.ejs', { message: 'Người dùng không tồn tại' });
            }

            // Get user's posts
            const posts = await Post.find({ author: profileUser._id }).populate('author', 'username avatar').sort({ createdAt: -1 });

            // Check if current user is logged in
            let user = null;
            let isFollowing = false;

            const token = req.cookies.token;
            if (token) {
                try {
                    const decoded = await fastify.jwt.verify(token);
                    user = await User.findById(decoded.id).select('-password');
                    
                    const followRecord = await Follow.findOne({ 
                        follower: decoded.id, 
        following: profileUser._id 
                    });
                    isFollowing = !!followRecord;
                } catch (err) {
                    console.log('Token verification failed:', err.message);
                }
            }

            const isOwnProfile = user && user._id.toString() === profileUser._id.toString();

            return rep.view('profile.ejs', {
                profileUser: profileUser.toObject(),
                posts: posts.map(p => p.toObject()),
                isFollowing,
                user: user ? user.toObject() : null,
                isOwnProfile
            });
        } catch (err) {
            console.log(err);
            return rep.code(500).send('Có lỗi trong quá trình lấy trang cá nhân');
        }
    });
}
