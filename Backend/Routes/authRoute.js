import { register, login, logout } from '../Controllers/authController.js';

export function authRoute(fastify, option){
    fastify.post('/register', register);
    fastify.post('/login', login);
    fastify.get('/logout', logout)
}