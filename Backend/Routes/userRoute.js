import * as userController from '../Controllers/userController.js';
import { authentication } from '../Middlewares/authentication.js';

export function userRoute(fastify, options){
    fastify.get('/users/me', { preHandler: authentication }, userController.getMyProfile);
    fastify.put('/users/me', { preHandler: authentication }, userController.updateMyProfile);
    fastify.get('/users/:userId', { preHandler: authentication }, userController.getUserProfile);
    fastify.post('/users/:userId/follow', { preHandler: authentication }, userController.followUser);
    fastify.get('/users/:userId/followers', { preHandler: authentication }, userController.getFollowers);
    fastify.get('/users/:userId/following', { preHandler: authentication }, userController.getFollowing);
    fastify.get('/users/:userId/posts', { preHandler: authentication }, userController.getUserPosts);
}
