import * as viewController from '../Controllers/viewController.js';
import { authentication } from '../Middlewares/authentication.js';

export function viewRoute(fastify, options) {
    fastify.get('/', { preHandler: authentication }, viewController.getHome);
    fastify.get('/get_posts', { preHandler: authentication }, viewController.getHomePosts)
    fastify.get('/explore', { preHandler: authentication }, viewController.getSearchPage);
    fastify.get('/auth', viewController.getAuth);
    fastify.get('/messages', viewController.getMessage)
    fastify.get('/post/:postId', viewController.getPostDetail);
}
