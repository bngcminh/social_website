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

const fastify = Fastify({ logger: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fix Error: querySrv ECONNREFUSED MongoDB
import dns from 'node:dns/promises'
import { fileURLToPath } from 'node:url';
dns.setServers(['1.1.1.1']);

import connectDB from './config/db.js'
import { userRoute } from './Routes/userRoute.js';
import { authRoute } from './Routes/authRoute.js';

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
    }
});
fastify.register(fastifyFormbody);
fastify.register(fastifyMultipart, {
    limits: {
        fileSize: 40 * 1024 * 1024,
    }
});

fastify.register(authRoute);
fastify.register(userRoute);

fastify.get('/', function(req, rep){
    rep.send('Run!')
});

try{
    fastify.listen({ port: process.env.PORT })
}catch(err){
    fastify.log.error(err);
}