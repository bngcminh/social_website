import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: { type: String, required: true },
    image: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likes:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }],
    likeCount: [{
        type: Number,
        default: 0
    }]
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;