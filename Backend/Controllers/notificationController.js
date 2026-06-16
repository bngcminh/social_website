import Notification from '../Models/Notification.js';
import User from '../Models/User.js';
import Post from '../Models/Post.js';

export async function createNotification({ recipient, sender, type, post, comment, url }){
    try{
        if(recipient.toString() === sender.toString()){
            return null;
        }

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            post: post || null,
            comment: comment || null,
            url: url || null
        });

        return notification;
    }catch(err){
        console.log('Lỗi tạo thông báo:', err);
        return null;
    }
}

export const getNotifications = async function(req, rep){
    try{
        const page = Math.max(Number.parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || '20', 10), 1), 50);

        const [notifications, totalNotifications] = await Promise.all([
            Notification.find({ recipient: req.user.id })
                .populate('sender', 'username avatar')
                .populate('post', 'content')
                .populate('comment', 'content')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Notification.countDocuments({ recipient: req.user.id })
        ]);

        return rep.send({
            success: true,
            notifications,
            page,
            totalPages: Math.ceil(totalNotifications / limit),
            totalNotifications
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy thông báo');
    }
}

export const getUnreadCount = async function(req, rep){
    try{
        const count = await Notification.countDocuments({
            recipient: req.user.id,
            isRead: false
        });

        return rep.send({ success: true, unreadCount: count });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình đếm thông báo');
    }
}

export const markAsRead = async function(req, rep){
    try{
        const notificationId = req.params.id;
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, recipient: req.user.id },
            { isRead: true },
            { new: true }
        );

        if(!notification){
            return rep.code(404).send('Không tìm thấy thông báo');
        }

        return rep.send({ success: true, notification });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình đánh dấu thông báo');
    }
}

export const markAllAsRead = async function(req, rep){
    try{
        await Notification.updateMany(
            { recipient: req.user.id, isRead: false },
            { isRead: true }
        );

        return rep.send({ success: true, message: 'Đã đánh dấu tất cả thông báo đã đọc' });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình đánh dấu thông báo');
    }
}

export const deleteNotification = async function(req, rep){
    try{
        const notificationId = req.params.id;
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: req.user.id
        });

        if(!notification){
            return rep.code(404).send('Không tìm thấy thông báo');
        }

        return rep.send({ success: true, message: 'Xóa thông báo thành công' });
    }catch(err){
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình xóa thông báo');
    }
}
