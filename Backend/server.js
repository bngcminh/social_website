import 'dotenv/config';

import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyView from '@fastify/view';
import fastifyFormbody from '@fastify/formbody';
import fastifyMutipart from '@fastify/multipart';
import fastifyJWT from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import path from 'node:path';

const fastify = Fastify({ logger: true });
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import connectDB from './config/db.js'

// Fix Error: querySrv ECONNREFUSED MongoDB
import dns from 'node:dns/promises'
import { fileURLToPath } from 'node:url';
dns.setServers(['1.1.1.1']);

fastify.register(connectDB);
fastify.register(fastifyJWT, {
    secret: env.process.JWT_KEY
});
// fastify.register(fastifyStatic);
// fastify.register(fastifyView);
fastify.register(fastifyFormbody);
fastify.register(fastifyMultipart);

fastify.get('/', function(req, rep){
    rep.send('Run!')
});

try{
    fastify.listen({ port: process.env.PORT })
}catch(err){
    fastify.log.error(err);
}