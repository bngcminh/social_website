import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    content: { type: String, required: true },
    images: [{ type: String }],
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    likeCount: {
        type: Number,
        default: 0
    },
    commentCount: {
        type: Number,
        default: 0
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });


const Post = mongoose.model('Post', postSchema);
export default Post;