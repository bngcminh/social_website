import User from '../../Models/User.js';
import Post from '../../Models/Post.js';
import Comment from '../../Models/Comment.js';
import Like from '../../Models/Like.js';
import Follow from '../../Models/Follow.js';
import Notification from '../../Models/Notification.js';
import { createNotification } from '../../Controllers/notificationController.js';

export const getDashboard = async function (req, rep) {
    try {
        const user = await User.findById(req.user.id).select('-password');

        const [totalUsers, totalPosts, totalComments, lockedUsers, hiddenPosts, hiddenComments] = await Promise.all([
            User.countDocuments(),
            Post.countDocuments(),
            Comment.countDocuments(),
            User.countDocuments({ isActive: false }),
            Post.countDocuments({ isHidden: true }),
            Comment.countDocuments({ isHidden: true })
        ]);

        return rep.view('admin.ejs', {
            user,
            stats: {
                totalUsers,
                totalPosts,
                totalComments,
                lockedUsers,
                hiddenPosts,
                hiddenComments
            }
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình tải trang quản trị');
    }
}

export const getUsers = async function (req, rep) {
    try {
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '15', 10), 1), 50);
        const search = req.query.search?.trim() || '';

        let filter = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter = {
                $or: [
                    { username: regex },
                    { email: regex }
                ]
            };
        }

        const [users, totalUsers] = await Promise.all([
            User.find(filter)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter)
        ]);

        return rep.send({
            success: true,
            users,
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy danh sách người dùng');
    }
}

export const toggleUserStatus = async function (req, rep) {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return rep.code(404).send('Không tìm thấy người dùng');
        }

        if (user.role === 'admin') {
            return rep.code(403).send('Không thể khóa tài khoản admin');
        }

        user.isActive = !user.isActive;
        await user.save();

        if (!user.isActive) {
            await createNotification({
                recipient: userId,
                sender: req.user.id,
                type: 'admin_lock_account',
                url: '/notifications'
            });
        }

        return rep.send({
            success: true,
            message: user.isActive ? 'Đã mở khóa tài khoản' : 'Đã khóa tài khoản',
            user: {
                _id: user._id,
                username: user.username,
                isActive: user.isActive
            }
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình thay đổi trạng thái tài khoản');
    }
}

export const deleteUser = async function (req, rep) {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return rep.code(404).send('Không tìm thấy người dùng');
        }

        if (user.role === 'admin') {
            return rep.code(403).send('Không thể xóa tài khoản admin');
        }

        await Promise.all([
            Post.deleteMany({ author: userId }),
            Comment.deleteMany({ author: userId }),
            Like.deleteMany({ user: userId }),
            Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] }),
            Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }),
            User.findByIdAndDelete(userId)
        ]);

        return rep.send({
            success: true,
            message: 'Đã xóa người dùng và toàn bộ dữ liệu liên quan'
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình xóa người dùng');
    }
}

export const getPosts = async function (req, rep) {
    try {
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '15', 10), 1), 50);
        const search = req.query.search?.trim() || '';

        let filter = {};
        if (search) {
            const regex = new RegExp(search, 'i');
            filter = { content: regex };
        }

        const [posts, totalPosts] = await Promise.all([
            Post.find(filter)
                .populate('author', 'username avatar')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Post.countDocuments(filter)
        ]);

        return rep.send({
            success: true,
            posts,
            page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy danh sách bài viết');
    }
}

export const togglePostVisibility = async function (req, rep) {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);

        if (!post) {
            return rep.code(404).send('Không tìm thấy bài viết');
        }

        post.isHidden = !post.isHidden;
        await post.save();

        if (post.isHidden) {
            await createNotification({
                recipient: post.author,
                sender: req.user.id,
                type: 'admin_lock_post',
                post: postId,
                url: '/notifications'
            });
        }

        return rep.send({
            success: true,
            message: post.isHidden ? 'Đã ẩn bài viết' : 'Đã hiện bài viết',
            post: {
                _id: post._id,
                isHidden: post.isHidden
            }
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình thay đổi trạng thái bài viết');
    }
}

export const deletePost = async function (req, rep) {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);

        if (!post) {
            return rep.code(404).send('Không tìm thấy bài viết');
        }

        await Promise.all([
            Comment.deleteMany({ post: postId }),
            Like.deleteMany({ post: postId }),
            Post.findByIdAndDelete(postId)
        ]);

        return rep.send({
            success: true,
            message: 'Đã xóa bài viết và dữ liệu liên quan'
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình xóa bài viết');
    }
}

export const getComments = async function (req, rep) {
    try {
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '15', 10), 1), 50);
        const postId = req.query.postId;

        let filter = {};
        if (postId) {
            filter.post = postId;
        }

        const [comments, totalComments] = await Promise.all([
            Comment.find(filter)
                .populate('author', 'username avatar')
                .populate('post', 'content')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Comment.countDocuments(filter)
        ]);

        return rep.send({
            success: true,
            comments,
            page,
            totalPages: Math.ceil(totalComments / limit),
            totalComments
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy danh sách bình luận');
    }
}

export const toggleCommentVisibility = async function (req, rep) {
    try {
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return rep.code(404).send('Không tìm thấy bình luận');
        }

        comment.isHidden = !comment.isHidden;
        await comment.save();

        return rep.send({
            success: true,
            message: comment.isHidden ? 'Đã ẩn bình luận' : 'Đã hiện bình luận',
            comment: {
                _id: comment._id,
                isHidden: comment.isHidden
            }
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình thay đổi trạng thái bình luận');
    }
}

export const deleteComment = async function (req, rep) {
    try {
        const commentId = req.params.commentId;
        const comment = await Comment.findById(commentId);

        if (!comment) {
            return rep.code(404).send('Không tìm thấy bình luận');
        }

        const del = await Comment.deleteMany({
            $or: [
                { _id: commentId },
                { parentComment: commentId }
            ]
        });

        await Post.findByIdAndUpdate(
            comment.post,
            { $inc: { commentCount: -del.deletedCount } }
        );

        return rep.send({
            success: true,
            message: 'Đã xóa bình luận',
            deletedCount: del.deletedCount
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình xóa bình luận');
    }
}
