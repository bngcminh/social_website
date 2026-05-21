import * as viewController from '../Controllers/viewController.js';

export function viewRoute(fastify, options) {
    fastify.get('/', viewController.getHome);
    fastify.get('/post', )
    fastify.get('/profile', viewController.getProfile);
}
