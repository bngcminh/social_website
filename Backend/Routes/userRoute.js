import * as userController from '../Controllers/userController.js';
import { authentication } from '../Middlewares/authentication.js';

export function userRoute(fastify, options){
    fastify.get('/profile/:username', { preHandler: authentication }, userController.getProfileUser);
    fastify.put('/profile/edit', { preHandler: authentication }, userController.updateProfile);
    fastify.post('/user/follow/:userId', { preHandler: authentication }, userController.followUser);
    fastify.get('/profile/:username/followers', { preHandler: authentication }, userController.getFollowers);
    fastify.get('/profile/:username/following', { preHandler: authentication }, userController.getFollowing);
    fastify.get('/api/users/suggestions', userController.getSuggestions);
    fastify.post('/posts/:postId/retweet', { preHandler: authentication }, userController.toggleRetweet);
    fastify.get('/posts/liked', { preHandler: authentication }, userController.getLikedPosts);
    fastify.get('/profile/:username/replies', userController.getUserReplies);
}
