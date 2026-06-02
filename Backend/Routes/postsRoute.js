import { getPosts, getPostById } from '../Controllers/postController.js';

export function postsRoute(fastify, options){
    fastify.get('/api/posts', getPosts);
    fastify.get('/api/posts/:postId', getPostById);
}
