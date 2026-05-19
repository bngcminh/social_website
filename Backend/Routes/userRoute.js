import * as userController from '../Controllers/userController.js';
import { authentication } from '../Middlewares/authentication.js';

export function userRoute(fastify, options){
    fastify.post('/user/create_post', { preHandler: authentication }, userController.createPost);
    fastify.put('/user/edit_post/:postId', { preHandler: authentication }, userController.editPost);
    fastify.delete('/user/delete_post/:postId', { preHandler: authentication }, userController.deletePost);
}