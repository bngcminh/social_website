import * as postController from '../Controllers/postController.js';
import { authentication } from '../Middlewares/authentication.js';

export function postRoute(fastify, option){
    fastify.post('/create_post', { preHandler: authentication }, postController.createPost);
    fastify.put('/edit_post/:postId', { preHandler: authentication }, postController.editPost);
    fastify.delete('/delete_post/:postId', { preHandler: authentication }, postController.deletePost);
}
