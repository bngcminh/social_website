import * as interactController from '../Controllers/interactController.js';
import { authentication } from '../Middlewares/authentication.js';

export function interactRoute(fastify, option){
    fastify.post('/posts/:postId/like', { preHandler: authentication }, interactController.likePost);
}
