import User from '../Models/User.js';
import Post from '../Models/Post.js';
import Follow from '../Models/Follow.js';
import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getProfile = async function(req, rep){
    try{
        const username = req.params.username;
        const currentUser = await User.findById(req.user.id).select('-password');
        const profileUser = await User.findOne({ username }).select('-password');
        
        if(!profileUser){
            rep.code(404).send('Người dùng không tồn tại!');
        }

        const posts = await Post.find({ author: profileUser._id })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
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
        rep.code(500).send('Có lỗi trong quá trình lấy thông tin cá nhân');
    }
}

export const updateProfile = async function(req, rep){
    try{
        const getMyInfor = await User.findById(req.user.id).select('-password');
        if(!getMyInfor){
            return rep.code(400).send('Không tìm thấy thông tin cá nhân');
        }
        const parts = req.parts();
        const data = {
            username: getMyInfor.username,
            bio: getMyInfor.bio,
            location: getMyInfor.location,
            website: getMyInfor.website,
            avatar: getMyInfor.avatar,
            coverImage: getMyInfor.coverImage
        }
        for await(const part of parts){
            if(part.type === 'field'){
                data[part.fieldname] = part.value
            }
            if(part.type === 'file'){
                const uploadDir = path.join(__dirname, '../../Frontend/public/upload');
                const fileName = `${Date.now()}-${part.filename}`;
                const upload = path.join(uploadDir, fileName);

                await pipeline(part.file, fs.createWriteStream(upload));
            }
        }
        if(!data.username || data.username.trim() < 6){
            rep.code(400).send('Vui lòng nhập tên người dùng trên 6 kí tự');
        }
        const existUsername = await User.findOne({
            username: data.username.trim(),
            _id: { $ne: req.user.id }
        });
        if(existUsername){
            rep.code(400).send('Tên người đã tòn tại, vui lòng nhập tên khác');
        }
        getMyInfor.username = data.username.trim();
        getMyInfor.bio = data.bio.trim() || '';
        getMyInfor.location = data.location.trim() || '';
        getMyInfor.website = data.website.trim() || '';
        getMyInfor.avatar = data.avatar.trim() || '';
        getMyInfor.coverImage = data.coverImage.trim() || '';
        await getMyInfor.save();
        rep.send({ getMyInfor })
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình cập nhật trang cá nhân')
    }
}

export const getUserPosts = async function(req, rep){
    try{
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if(!user){
            rep.code(400).send('Người dùng khong tồn tại');
        }

        const posts = await Post.find({ author: userId })
            .populate('author', 'username avatar')
            .populate({
                path: 'rePostOf',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            })
            .sort({ createAt: -1 })
        return rep.send({ posts });
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình lấy các bài viết người dùng này');
    }
}

export const getFollowers = async function(req, rep){
    try{
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if(!user){
            rep.code(400).send('Người dùng khong tồn tại');
        }

        const followers = await Follow.findById({ following: userId })
            .populate('follower', 'username avatar')
            .sort({ createAt: -1 });
        rep.send({
            followers: followers.map(function(item){
                return item.follower;
            })
        });
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình lấy người theo dõi người dùng này');
    }
}

export const getFollowing = async function(req, rep){
    try{
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if(!user){
            rep.code(400).send('Người dùng khong tồn tại');
        }

        const following = await Follow.findById({ follower: userId })
            .populate('follower', 'username avatar')
            .sort({ createAt: -1 });
        rep.send({
            following: following.map(function(item){
                return item.following;
            })
        });
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình lấy người đang theo dõi người dùng này');
    }
}

export const followUser = async function(req, rep){
    try{
        const followingId = req.params.followingId;
        if(followingId === req.user.id){
            return rep.code(400).send('Không thể theo dõi chính mình');
        }
        
        const existUser = await User.findById(followingId);
        if(!existUser){
            return rep.code(400).send('Người dùng không tồn tại');
        }
        
        const followExist = Follow.findOne({
            follower: req.user.id,
            following: followingId
        });
        
        if(followExist){
            await Follow.deleteOne();
            const followingUser = await User.findByIdAndUpdate(
                req.user.id,
                { $inc: { followingCount: -1 } },
                { new: true }
            ).select('followingCount');
            const followedUser = await User.findByIdAndUpdate(
                followingId,
                { $inc: { followersCount: -1 } },
                { new: true }
            ).select('followersCount');
            return rep.send({
                followed: false,
                followingCount: followingUser.followingCount,
                followersCount: followedUser.followersCount
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
            followed: true,
            followingCount: followingUser.followingCount,
            followersCount: followedUser.followersCount
        });
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình cập nhật trang cá nhân')
    }
}