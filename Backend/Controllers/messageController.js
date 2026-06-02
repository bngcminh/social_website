import User from '../Models/User.js';
import Conversation from '../Models/Coversation.js';
import Message from '../Models/Message.js';

export const getMessages = async function(req, rep) {
    try {
        const token = req.cookies.token;
        
        if (!token) {
            return rep.redirect('/auth');
        }

        let currentUser = null;
        try {
            const decoded = await req.server.jwt.verify(token);
            currentUser = await User.findById(decoded.id).select('-password');
        } catch (err) {
            return rep.redirect('/auth');
        }

        if (!currentUser) {
            return rep.redirect('/auth');
        }

        // Get all conversations for current user
        const conversations = await Conversation.find({ 
            participants: currentUser._id 
        }).populate('participants', 'username avatar')
          .sort({ updatedAt: -1 });

        // Get messages for display
        const conversationsWithMessages = await Promise.all(
            conversations.map(async (conv) => {
                const messages = await Message.find({ conversation: conv._id })
                    .populate('sender', 'username avatar')
                    .sort({ createdAt: -1 })
                    .limit(1);
                
                return {
                    ...conv.toObject(),
                    lastMessage: messages[0] || null
                };
            })
        );

        return rep.view('messages.ejs', { 
            user: currentUser,
            conversations: conversationsWithMessages 
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send('Có lỗi trong quá trình lấy tin nhắn');
    }
}

export const getConversation = async function(req, rep) {
    try {
        const token = req.cookies.token;
        const { conversationId } = req.params;

        if (!token) {
            return rep.code(401).send({ success: false, message: 'Chưa đăng nhập' });
        }

        let currentUser = null;
        try {
            const decoded = await req.server.jwt.verify(token);
            currentUser = await User.findById(decoded.id).select('-password');
        } catch (err) {
            return rep.code(401).send({ success: false, message: 'Token không hợp lệ' });
        }

        // Get conversation
        const conversation = await Conversation.findById(conversationId).populate('participants', 'username avatar');
        
        if (!conversation) {
            return rep.code(404).send({ success: false, message: 'Cuộc trò chuyện không tồn tại' });
        }

        // Check if user is participant
        const isParticipant = conversation.participants.some(p => p._id.toString() === currentUser._id.toString());
        if (!isParticipant) {
            return rep.code(403).send({ success: false, message: 'Không có quyền truy cập' });
        }

        // Get messages in conversation
        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username avatar')
            .sort({ createdAt: 1 });

        // Mark messages as seen
        await Message.updateMany(
            { conversation: conversationId, sender: { $ne: currentUser._id }, isSeen: false },
            { isSeen: true }
        );

        return rep.send({ 
            success: true, 
            data: {
                conversation,
                messages
            }
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send({ success: false, message: 'Có lỗi trong quá trình lấy cuộc trò chuyện' });
    }
}

export const sendMessage = async function(req, rep) {
    try {
        const token = req.cookies.token;
        const { conversationId, content, image } = req.body;

        if (!token) {
            return rep.code(401).send({ success: false, message: 'Chưa đăng nhập' });
        }

        let currentUser = null;
        try {
            const decoded = await req.server.jwt.verify(token);
            currentUser = await User.findById(decoded.id).select('-password');
        } catch (err) {
            return rep.code(401).send({ success: false, message: 'Token không hợp lệ' });
        }

        if (!content && (!image || image.length === 0)) {
            return rep.code(400).send({ success: false, message: 'Tin nhắn không được để trống' });
        }

        // Get conversation and check participation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return rep.code(404).send({ success: false, message: 'Cuộc trò chuyện không tồn tại' });
        }

        const isParticipant = conversation.participants.some(p => p.toString() === currentUser._id.toString());
        if (!isParticipant) {
            return rep.code(403).send({ success: false, message: 'Không có quyền truy cập' });
        }

        // Create message
        const message = new Message({
            conversation: conversationId,
            sender: currentUser._id,
            content: content || '',
            image: image || []
        });

        await message.save();
        await message.populate('sender', 'username avatar');

        // Update conversation's updatedAt
        conversation.updatedAt = new Date();
        await conversation.save();

        return rep.send({ 
            success: true, 
            data: message
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send({ success: false, message: 'Có lỗi khi gửi tin nhắn' });
    }
}

export const startConversation = async function(req, rep) {
    try {
        const token = req.cookies.token;
        const { userId } = req.body;

        if (!token) {
            return rep.code(401).send({ success: false, message: 'Chưa đăng nhập' });
        }

        let currentUser = null;
        try {
            const decoded = await req.server.jwt.verify(token);
            currentUser = await User.findById(decoded.id).select('-password');
        } catch (err) {
            return rep.code(401).send({ success: false, message: 'Token không hợp lệ' });
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return rep.code(404).send({ success: false, message: 'Người dùng không tồn tại' });
        }

        if (userId === currentUser._id.toString()) {
            return rep.code(400).send({ success: false, message: 'Không thể tạo cuộc trò chuyện với chính mình' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [currentUser._id, userId] }
        });

        if (conversation) {
            return rep.send({ success: true, data: conversation });
        }

        // Create new conversation
        conversation = new Conversation({
            participants: [currentUser._id, userId]
        });

        await conversation.save();
        await conversation.populate('participants', 'username avatar');

        return rep.send({ 
            success: true, 
            data: conversation
        });
    } catch (err) {
        console.log(err);
        return rep.code(500).send({ success: false, message: 'Có lỗi khi tạo cuộc trò chuyện' });
    }
}
