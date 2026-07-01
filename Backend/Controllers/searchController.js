import Post from '../Models/Post.js';
import User from '../Models/User.js';

function escapeRegex(text){
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const searchInformation = async function(req, rep){
    try{
        const keyword = req.query.q?.trim();
        const type = req.query.type;
        
        if(!keyword){
            return rep.send({
                keyword: '',
                users: [],
                posts: []
            });
        }

        const regex = new RegExp(escapeRegex(keyword), 'i');
        let users = [];
        let posts = [];

        if(!type || type === 'all' || type === 'users'){
            users = await User.find({
                $or: [
                    { username: regex },
                    { email: regex },
                    { bio: regex }
                ],
                isActive: true
            })
            .select('username email avatar bio followersCount followingCount')
            .limit(10);
        }

        if(!type || type === 'all' || type === 'posts'){
            posts = await Post.find({
                content: regex,
                rePostOf: null
            })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(20);
        }

        return rep.send({
            keyword,
            users,
            posts
        });
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình tìm kiếm thông tin');
    }
}
