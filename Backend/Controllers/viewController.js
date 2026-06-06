import User from '../Models/User.js';
import Follow from '../Models/Follow.js';
import Post from '../Models/Post.js';

function formPostData(){
    return {
        id: Post._id,
        _id: Post._id,
        content: Post.content,
        media: Post.media,
        author: Post.author,
        likeCount: Post.likeCount,
        commentCount: Post.commentCount,
        viewsCount: Post.viewsCount,
        repostCount: Post.repostCount,
        repostOf: Post.repostOf,
        isEdited: Post.isEdited,
        createdAt: Post.createdAt,
        updatedAt: Post.updatedAt
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
        return rep.code(500).send('Co loi trong qua trinh hien thi trang dang nhap');
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

export const getPostDetail = async function(req, rep){
    try{
        const postId = req.params.postId;
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

        return rep.send({ post: formPostData() });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Co loi trong qua trinh lay bai viet nay');
    }
}
