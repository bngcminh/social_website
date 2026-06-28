import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Follow from '../Models/Follow.js';
import Like from '../Models/Like.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProfileUser = async function(req, rep){
    try{
        const username = req.params.username;
        const currentUser = await User.findById(req.user.id).select('-password');
        const profileUser = await User.findOne({ username }).select('-password');

        if(!profileUser){
            return rep.code(404).send('Nguoi dung khong ton tai');
        }

        const posts = await Post.find({ author: profileUser._id })
            .populate('author', 'username avatar')
            .populate({
                path: 'rePostOf',
                select: 'content media author likeCount commentCount viewsCount repostCount createdAt',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            })
            .sort({ createdAt: -1 });

        const isOwnProfile = currentUser._id.toString() === profileUser._id.toString();
        const isFollowing = isOwnProfile ? false : !!await Follow.exists({
            follower: currentUser._id,
            following: profileUser._id
        });

        return rep.view('profile.ejs', {
            user: currentUser,
            profileUser,
            posts,
            isOwnProfile,
            isFollowing
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy trang nhân');
    }
}

export const updateProfile = async function(req, rep){
    try{
        const getMyInfor = await User.findById(req.user.id).select('-password');

        if(!getMyInfor){
            return rep.code(400).send({
                success: false,
                message: 'Không tìm thấy trang cá nhân'
            });
        }

        const parts = req.parts();
        const data = {
            username: getMyInfor.username || '',
            bio: getMyInfor.bio || '',
            location: getMyInfor.location || '',
            website: getMyInfor.website || '',
            avatar: getMyInfor.avatar || '',
            coverImage: getMyInfor.coverImage || ''
        };

        for await(const part of parts){
            if(part.type === 'field'){
                data[part.fieldname] = part.value;
            }

            if(part.type === 'file'){
                if(!part.mimetype.startsWith('image/')){
                    return rep.code(400).send({
                        success: false,
                        message: 'Chỉ được upload hình ảnh'
                    });
                }

                const uploadDir = path.join(__dirname, '../../Frontend/public/upload');
                await fs.promises.mkdir(uploadDir, { recursive: true });

                const fileName = `${Date.now()}-${part.filename}`;
                const upload = path.join(uploadDir, fileName);

                await pipeline(part.file, fs.createWriteStream(upload));

                if(part.fieldname === 'coverImage'){
                    data.coverImage = `/upload/${fileName}`;
                }else{
                    data.avatar = `/upload/${fileName}`;
                }
            }
        }

        if(!data.username || data.username.trim().length < 6){
            return rep.code(400).send({
                success: false,
                message: 'Vui lòng nhập tên người dùng trên 6 kí tự'
            });
        }

        const existUsername = await User.findOne({
            username: data.username.trim(),
            _id: { $ne: req.user.id }
        });

        if(existUsername){
            return rep.code(400).send({
                success: false,
                message: 'Tên người dùng đã tồn tại, vui lòng nhập tên khác'
            });
        }

        getMyInfor.username = data.username.trim();
        getMyInfor.bio = data.bio?.trim() || '';
        getMyInfor.location = data.location?.trim() || '';
        getMyInfor.website = data.website?.trim() || '';
        getMyInfor.avatar = data.avatar || '';
        getMyInfor.coverImage = data.coverImage || '';

        await getMyInfor.save();

        return rep.send({
            success: true,
            message: 'Cập nhật trang cá nhân thành công',
            user: getMyInfor
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi trong quá trình cập nhật trang cá nhân'
        });
    }
}

export const getFollowers = async function(req, rep){
    try{
        const username = req.params.username;
        const user = await User.findOne({ username });

        if(!user){
            return rep.code(400).send('Người dùng không tồn tại');
        }

        const followers = await Follow.find({ following: user._id })
            .populate('follower', 'username avatar')
            .sort({ createdAt: -1 });

        return rep.send({
            followers: followers.map(function(item){
                return item.follower;
            })
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy người theo dõi');
    }
}

export const getFollowing = async function(req, rep){
    try{
        const username = req.params.username;
        const user = await User.findOne({ username });

        if(!user){
            return rep.code(400).send('Nguoi dung khong ton tai');
        }

        const following = await Follow.find({ follower: user._id })
            .populate('following', 'username avatar')
            .sort({ createdAt: -1 });

        return rep.send({
            following: following.map(function(item){
                return item.following;
            })
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy người đang theo dõi');
    }
}

export const followUser = async function(req, rep){
    try{
        const followingId = req.params.userId;

        if(followingId === req.user.id){
            return rep.code(400).send('Không thể theo dõi chính mình');
        }

        const existUser = await User.findById(followingId);

        if(!existUser){
            return rep.code(400).send('Người dùng không tồn tại');
        }

        const followExist = await Follow.findOne({
            follower: req.user.id,
            following: followingId
        });

        if(followExist){
            await Follow.deleteOne({
                follower: req.user.id,
                following: followingId
            });

            const followingUser = await User.findOneAndUpdate(
                {
                    _id: req.user.id,
                    followingCount: { $gt: 0 }
                },
                { $inc: { followingCount: -1 } },
                { new: true }
            ).select('followingCount');

            const followedUser = await User.findOneAndUpdate(
                {
                    _id: followingId,
                    followersCount: { $gt: 0 }
                },
                { $inc: { followersCount: -1 } },
                { new: true }
            ).select('followersCount');

            const currentUser = followingUser || await User.findById(req.user.id).select('followingCount');
            const targetUser = followedUser || await User.findById(followingId).select('followersCount');

            return rep.send({
                success: true,
                followed: false,
                following: false,
                followingCount: currentUser.followingCount,
                followersCount: targetUser.followersCount
            });
        }

        await Follow.create({
            follower: req.user.id,
            following: followingId
        });

        const followingUser = await User.findByIdAndUpdate(
            req.user.id,
            { $inc: { followingCount: 1 } },
            { new: true }
        ).select('followingCount');

        const followedUser = await User.findByIdAndUpdate(
            followingId,
            { $inc: { followersCount: 1 } },
            { new: true }
        ).select('followersCount');

        return rep.send({
            success: true,
            followed: true,
            following: true,
            followingCount: followingUser.followingCount,
            followersCount: followedUser.followersCount
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình cập nhật trang cá nhân');
    }
}

export const getSuggestions = async function(req, rep){
    try{
        let currentUserId = null;
        const token = req.cookies?.token;

        if(token){
            try{
                const decoded = req.server.jwt.verify(token);
                currentUserId = decoded.id;
            }catch(err){
                currentUserId = null;
            }
        }

        const query = currentUserId ? { _id: { $ne: currentUserId } } : {};
        const users = await User.find(query)
            .select('username avatar')
            .limit(100);

        const shuffled = users.sort(() => 0.5 - Math.random()).slice(0, 3);
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
                following
            });
        }

        return rep.send({
            success: true,
            data
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Co loi khi lay goi y'
        });
    }
}

export const toggleRetweet = async function(req, rep){
    try{
        const currentUserId = req.user.id;
        const postId = req.params.postId;
        const post = await Post.findById(postId).populate('author', 'username');

        if(!post){
            return rep.code(404).send({
                success: false,
                message: 'Khong tim thay bai viet'
            });
        }

        const existing = await Post.findOne({
            rePostOf: postId,
            author: currentUserId
        });

        if(existing){
            await Post.deleteOne({ _id: existing._id });
            post.repostCount = Math.max(0, (post.repostCount || 0) - 1);
            await post.save();

            return rep.send({
                success: true,
                retweeted: false,
                repostCount: post.repostCount,
                message: 'Da bo chia se'
            });
        }

        await Post.create({
            content: `Chia se tu @${post.author.username}`,
            author: currentUserId,
            rePostOf: postId
        });

        post.repostCount = (post.repostCount || 0) + 1;
        await post.save();

        return rep.send({
            success: true,
            retweeted: true,
            repostCount: post.repostCount,
            message: 'Da chia se bai viet'
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi đăng lại bài viết'
        });
    }
}

export const getLikedPosts = async function(req, rep){
    try{
        const userId = req.user.id;
        const likes = await Like.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'post',
                populate: { path: 'author' }
            });

        const posts = likes.map((like) => like.post).filter((post) => post !== null);

        return rep.code(200).send({
            success: true,
            posts
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false,
            message: 'Có lỗi khi lấy danh sách các bài viết đã thích'
        });
    }
}
