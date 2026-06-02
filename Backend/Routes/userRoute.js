import * as userController from '../Controllers/userController.js';
import { authentication } from '../Middlewares/authentication.js';

export function userRoute(fastify, options){
    fastify.get('/api/users/suggestions', userController.getSuggestions);
    fastify.post('/user/follow/:userId', { preHandler: authentication }, userController.toggleFollow);
    fastify.post('/user/create_post', { preHandler: authentication }, userController.createPost);
    fastify.put('/user/edit_post/:postId', { preHandler: authentication }, userController.editPost);
    fastify.delete('/user/delete_post/:postId', { preHandler: authentication }, userController.deletePost);
    fastify.get('/api/posts/liked', { preHandler: authentication }, userController.getLikedPosts);
    fastify.post('/api/posts/:postId/like', { preHandler: authentication }, userController.toggleLike);
    fastify.post('/api/posts/:postId/retweet', { preHandler: authentication }, userController.toggleRetweet);
    fastify.post('/api/posts/:postId/reply', { preHandler: authentication }, userController.addReply);
}