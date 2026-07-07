import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: [
            'like',
            'comment',
            'follow',
            'admin_lock_post',
            'admin_lock_account'
        ],
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        default: null
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    isRead: { type: Boolean, default: false },
    url: { type: String, default: null },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 })
const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
