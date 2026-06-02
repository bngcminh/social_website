import * as messageController from '../Controllers/messageController.js';
import { authentication } from '../Middlewares/authentication.js';

export function messageRoute(fastify, options) {
    // View messages page
    fastify.get('/messages', messageController.getMessages);

    // Get specific conversation with messages
    fastify.get('/api/conversations/:conversationId', messageController.getConversation);

    // Send message
    fastify.post('/api/messages/send', messageController.sendMessage);

    // Start new conversation
    fastify.post('/api/conversations/start', messageController.startConversation);
}
