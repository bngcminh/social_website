import Conversation from '../Models/Coversation.js';
import Message from '../Models/Message.js';
import User from '../Models/User.js';

export const getConversations = async function(req, rep){
    try{
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate('participants', 'username avatar')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'username avatar'
            }
        })
        .sort({ createdAt: -1 });
        rep.send({
            success: true,
            conversations,
            message: 'Lấy danh sách cuộc trò chuyện thành công'
        });
    }catch(err){
        console.log(err);
    }
}

export const createConversation = async function(req, rep){
    try{
        const receiverId = req.body.receiverId;
        if(!receiverId || receiverId === req.user.id){
            return rep.code(400).send({
                success: false,
                message: 'Thieu receiverId'
            });
        }
        const receiver = await User.findById(receiverId);
        if(!receiver){
            return rep.code(400).send({
                success: false,
                message: 'Nguoi dung khong ton tai'
            });
        }
        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user.id, receiverId],
                $size: 2
            }
        })
        .populate('participants', 'username avatar')
        .populate('lastMessage');
        if(conversation){
            return rep.send({
                success: true,
                conversation
            });
        }
        conversation = await Conversation.create({
            participants: [req.user.id, receiverId]
        });
        conversation = await Conversation.findById(conversation._id)
            .populate('participants', 'username avatar')
            .populate('lastMessage')
        return rep.send({
            success: true,
            conversation
        });
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false
        });
    }
}

export const getMessage = async function(req, rep){
    try{
        const conversationId = req.params.conversationId;
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });
        if(!conversation){
            return rep.code(400).send({
                success: false
            });
        }
        const messages = await Message.find({
            conversation: conversationId
        })
        .populate('sender', 'username avatar')
        .sort({ createdAt: 1 });
        return rep.send({
            success: true,
            messages
        })
    }catch(err){
        console.log(err);
        return rep.code(500).send({
            success: false
        })
    }
}
