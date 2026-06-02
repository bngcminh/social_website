import mongoose from 'mongoose';
import 'dotenv/config';
import User from './Models/User.js';
import Conversation from './Models/Coversation.js';
import Message from './Models/Message.js';

const MONGODB_URI = process.env.DATABASE;

async function seedMessages() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get any 2 users
        const users = await User.find().limit(2);
        
        if (users.length < 2) {
            console.log('❌ Cần ít nhất 2 tài khoản người dùng. Hãy tạo 2 tài khoản trước!');
            process.exit(1);
        }

        const user1 = users[0];
        const user2 = users[1];

        console.log(`\n👥 Người dùng tìm thấy:`);
        console.log(`   User 1: ${user1.username}`);
        console.log(`   User 2: ${user2.username}`);

        // Check if conversation exists
        let conversation = await Conversation.findOne({
            participants: { $all: [user1._id, user2._id] }
        });

        if (!conversation) {
            console.log(`\n📝 Tạo cuộc trò chuyện mới...`);
            conversation = await Conversation.create({
                participants: [user1._id, user2._id]
            });
            console.log(`✅ Tạo cuộc trò chuyện thành công`);
        } else {
            console.log(`\n✅ Cuộc trò chuyện đã tồn tại`);
        }

        // Delete existing messages for this conversation
        await Message.deleteMany({ conversation: conversation._id });
        console.log(`\n🗑️  Xóa tin nhắn cũ`);

        // Create test messages
        const messages = [
            {
                conversation: conversation._id,
                sender: user1._id,
                content: 'Chào bạn! 👋',
                isSeen: true
            },
            {
                conversation: conversation._id,
                sender: user2._id,
                content: 'Chào! Bạn khỏe không? 😊',
                isSeen: true
            },
            {
                conversation: conversation._id,
                sender: user1._id,
                content: 'Khỏe, cảm ơn bạn hỏi',
                isSeen: true
            },
            {
                conversation: conversation._id,
                sender: user2._id,
                content: 'Mình muốn nói chuyện với bạn về cái gì đó',
                isSeen: true
            },
            {
                conversation: conversation._id,
                sender: user1._id,
                content: 'Dạ, bạn nói đi 👂',
                isSeen: false
            },
            {
                conversation: conversation._id,
                sender: user2._id,
                content: 'Thực ra là... không có gì lớn lao cả 😅',
                isSeen: false
            }
        ];

        const insertedMessages = await Message.insertMany(messages);
        console.log(`\n💬 Tạo thành công ${insertedMessages.length} tin nhắn test\n`);

        // Update conversation updatedAt
        conversation.updatedAt = new Date();
        await conversation.save();

        console.log('✅ Hoàn thành! Hãy truy cập /messages để xem tin nhắn\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    }
}

seedMessages();
