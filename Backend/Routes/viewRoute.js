import * as viewController from '../Controllers/viewController.js';
import { authentication } from '../Middlewares/authentication.js';

export function viewRoute(fastify, options) {
    fastify.get('/', { preHandler: authentication }, viewController.getHome);
    fastify.get('/get_posts', { preHandler: authentication }, viewController.getHomePosts);
    fastify.get('/get_following_posts', { preHandler: authentication }, viewController.getFollowingPosts);
    fastify.get('/explore', { preHandler: authentication }, viewController.getSearchPage);
    fastify.get('/auth', viewController.getAuth);
    fastify.get('/messages', { preHandler: authentication },viewController.getMessage)
    fastify.get('/post/:postId', { preHandler: authentication },viewController.getPostDetail);
}
