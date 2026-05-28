import Post from '../Models/Post.js';
import User from '../Models/User.js';

export const searchInformation = async function(req, rep){
    try{
        const keyword = req.query.q?.trim();
        const type = req.query.type;
        
        if(!keyword){
            return rep.code(400).send('Vui lòng nhập thông tin cần tìm');
        }

        const regex = new RegExp(keyword, 'i');
        let users = [];
        let posts = [];
        if(type === 'users'){
            users = await User.find({
                $or: [
                    { username: regex },
                    { email: regex },
                    { bio: regex }
                ],
                isActive: true
            })
            .select('username email avatar bio followersCount followingCount')
            .limit(10)
        }

        if(type === 'posts'){
            posts = await Post.find({
                content: regex 
            })
            .populate('author', 'username avatar')
            .sort({ createAt: -1 })
            .limit(20)
        }

        return rep.send({
            keyword,
            users,
            posts
        })
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình tìm kiếm thông tin');
    }
}