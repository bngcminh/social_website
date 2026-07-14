import * as messageController from '../Controllers/messageController.js'
import { authentication } from '../Middlewares/authentication.js';

export function messageRoute(fastify, option){
    fastify.get('/conversations', { preHandler: authentication }, messageController.getConversations);
    fastify.post('/conversations', { preHandler: authentication }, messageController.createConversation);
    fastify.get('/conversations/:conversationId/messages', { preHandler: authentication }, messageController.getMessage);
}