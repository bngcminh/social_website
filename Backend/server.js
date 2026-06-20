import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import ejs from 'ejs'
import fastifyFormbody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import fastifyJWT from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';

const fastify = Fastify({ logger: true });
const io = new Server(fastify.server);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix Error: querySrv ECONNREFUSED MongoDB
import dns from 'node:dns/promises'
dns.setServers(['1.1.1.1']);

import connectDB from './config/db.js'
import { userRoute } from './Routes/userRoute.js';
import { authRoute } from './Routes/authRoute.js';
import { viewRoute } from './Routes/viewRoute.js';
import { postRoute } from './Routes/postRoute.js';
import { interactRoute } from './Routes/interactRoute.js';
import { searchRoute } from './Routes/searchRoute.js';
import { messageRoute } from './Routes/messageRoute.js';
import Conversation from './Models/Coversation.js';
import Message from './Models/Message.js';
import { notificationRoute } from './Routes/notificationRoute.js';
import { adminRoute } from './Admin/Routes/adminRoute.js';

fastify.register(connectDB);
fastify.register(fastifyJWT, {
    secret: process.env.JWT_KEY
});
fastify.register(fastifyCookie)
fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../Frontend/public'),
    prefix: '/public/'
});

fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../Frontend/public/upload'),
    prefix: '/upload/',
    decorateReply: false
});

fastify.register(fastifyView,  {
    engine: {
        ejs: ejs
    },
    root: path.join(__dirname, '../Frontend/views')
});
fastify.register(fastifyFormbody);
fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 40 * 1024 * 1024,
    }
});

fastify.register(authRoute);
fastify.register(userRoute);
fastify.register(viewRoute);
fastify.register(postRoute);
fastify.register(interactRoute);
fastify.register(searchRoute);
fastify.register(messageRoute);
fastify.register(notificationRoute);
fastify.register(adminRoute);

io.on('connection', function(socket){
    console.log('connected', socket.id);

    socket.on('join conversation', async function(data){
        try{
            const { conversationId, userId } = data;

            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: userId
            });

            if(!conversation){
                socket.emit('chat error', {
                    message: 'Không có quyền vào phòng chat này'
                });
                return;
            }

            socket.join(conversationId);

            socket.emit('joined conversation', {
                conversationId
            });
        }catch(err){
            console.log(err);
            socket.emit('chat error', {
                message: 'Có lỗi khi vào phòng chat'
            });
        }
    });

    socket.on('send message', async function(data){
        try{
            const { conversationId, senderId, content } = data;

            if(!content || !content.trim()){
                socket.emit('chat error', {
                    message: 'Tin nhắn không được để trống'
                });
                return;
            }

            const conversation = await Conversation.findOne({
                _id: conversationId,
                participants: senderId
            });

            if(!conversation){
                socket.emit('chat error', {
                    message: 'Không có quyền gửi tin nhắn'
                });
                return;
            }

            let message = await Message.create({
                conversation: conversationId,
                sender: senderId,
                content: content.trim()
            });

            await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: message._id
            });

            message = await Message.findById(message._id)
                .populate('sender', 'username avatar');

            io.to(conversationId).emit('new message', message);
        }catch(err){
            console.log(err);
            socket.emit('chat error', {
                message: 'Có lỗi khi gửi tin nhắn'
            });
        }
    });

    socket.on('disconnect', function(){
        console.log('disconnected', socket.id);
    });
});

fastify.listen({ port: process.env.PORT }, function(err){
    if(err){
        fastify.log.error(err);
        process.exit(1);
    }
});
