import * as interactController from '../Controllers/interactController.js';
import { authentication } from '../Middlewares/authentication.js';

export function interactRoute(fastify, option){
    fastify.post('/posts/:postId/like', { preHandler: authentication }, interactController.likePost);
    fastify.get('/posts/:postId/comments', { preHandler: authentication }, interactController.getComments);
    fastify.post('/posts/:postId/comments', { preHandler: authentication }, interactController.createComment);
    fastify.put('/comments/:commentId', { preHandler: authentication }, interactController.editComment);
    fastify.delete('/comments/:commentId', { preHandler: authentication }, interactController.deleteComment);
    fastify.post('/posts/:postId/repost', { preHandler: authentication }, interactController.rePost);
}
