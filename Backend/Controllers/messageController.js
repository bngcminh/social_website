import Conversation from '../Models/Coversation.js';
import Message from '../Models/Message.js';

export const getConversations = async function(req, rep){
    try{
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate('participants', 'username avatar')
        .populate({
            path: 'lastMessage',
            select: 'username avatar'
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
        const recieverId = req.params.recieverId;
        if(!recieverId || recieverId === req.user.id){
            return rep.code(400).send({
                success: false
            });
        }
        const reciever = await User.findById(recieverId);
        if(!reciever){
            return rep.code(400).send({
                success: false
            });
        }
        let conversation = await Conversation.findOne({
            participants: {
                $all: [req.user.id, recieverId],
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
            participants: [req.user.id, recieverId]
        });
        conversation = await Conversation.find(conversation._id)
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
        .sort({ createdAt: -1 });
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

export const sendMessage = async function(req, rep){
    try{
        const conversationId = req.params.conversationId;
        const content = req.body.content;

        if(!content || !content.trim()){
            return rep.code(400).send({
                success: false
            })
        }
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });
        if(!conversation){
            return rep.code(400).send({
                success: false
            })
        }
        let message = await Message.create({
            conversation: conversationId,
            sender: req.user.id,
            content: content.trim()
        })
        await Conversation.findByIdAndUpdate(
            conversationId,
            { lastMessage: message._id }
        )
        message = await Message.findById(message._id).populate('sender', 'username avatar');
        return rep.send({
            success: true,
            message
        })
    }catch(err){
        console.log(err)
        return rep.code(500).send({
            success: false
        })
    }
}