import User from '../Models/User.js';
import Follow from '../Models/Follow.js';
import Post from '../Models/Post.js';
import Like from '../Models/Like.js';
import Comment from '../Models/Comment.js';
import Notifcation from '../Models/Notification.js';
import Coversation from '../Models/Coversation.js';

// export const getHome = async function(params){
//     try{
//         const posts = await Post.find();
//         const  
//     }catch(err){

//     }
// }

export const getProfile = async function(req, rep){
    try{
        const getInfor = await User.findById(req.user.id);
        rep.send({ getInfor }); 
    }catch(err){
        console.log(err);
        rep.code(500).send('Có lỗi trong quá trình lấy trang cá nhân')
    }
}
