import * as userController from '../Controllers/userController.js';
import { authentication } from '../Middlewares/authentication.js';

export function userRoute(fastify, options){
    fastify.get('/profile/:username', { preHandler: authentication }, userController.getProfileUser);
    fastify.put('/profile/edit', { preHandler: authentication }, userController.updateProfile);
    fastify.post('/user/follow/:userId', { preHandler: authentication }, userController.followUser);
    fastify.get('/api/users/suggestions', userController.getSuggestions);
    fastify.get('/posts/liked', { preHandler: authentication }, userController.getLikedPosts);
    fastify.get('/profile/:username/replies', { preHandler: authentication }, userController.getUserReplies);
    fastify.get('/profile/:username/reposts', { preHandler: authentication }, userController.getUserReposts);
}
