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

io.on('Connetion', function(socket){
    console.log('connected', socket.id);
    socket.emit('chat message', function(msg){
        console.log(msg);
        io.emit('chat message', msg)
    });
});

fastify.listen({ port: process.env.PORT }, function(err){
    if(err){
        fastify.log.error(err);
        process.exit(1);
    }
});
