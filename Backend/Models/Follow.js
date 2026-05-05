import mongoose from "mongoose";

const followSchema = new mongoose.Schema({
    follower:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    following:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: true
    }
}, { timestamps: true })

followSchema.index({ follower: 1, following: 1 }, { unique: true });
const Follow = mongoose.model('Follow', followSchema);
export default Follow;