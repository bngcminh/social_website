import * as adminController from '../Controllers/adminController.js';
import { authentication } from '../../Middlewares/authentication.js';
import { authorization } from '../../Middlewares/authorization.js';

export function adminRoute(fastify, option) {
    const adminPreHandler = [authentication, authorization('admin')];

    fastify.get('/admin', { preHandler: adminPreHandler }, adminController.getDashboard);

    fastify.get('/admin/users', { preHandler: adminPreHandler }, adminController.getUsers);
    fastify.put('/admin/users/:userId/toggle', { preHandler: adminPreHandler }, adminController.toggleUserStatus);
    fastify.delete('/admin/users/:userId', { preHandler: adminPreHandler }, adminController.deleteUser);

    fastify.get('/admin/posts', { preHandler: adminPreHandler }, adminController.getPosts);
    fastify.put('/admin/posts/:postId/toggle', { preHandler: adminPreHandler }, adminController.togglePostVisibility);
    fastify.delete('/admin/posts/:postId', { preHandler: adminPreHandler }, adminController.deletePost);

    fastify.get('/admin/comments', { preHandler: adminPreHandler }, adminController.getComments);
    fastify.put('/admin/comments/:commentId/toggle', { preHandler: adminPreHandler }, adminController.toggleCommentVisibility);
    fastify.delete('/admin/comments/:commentId', { preHandler: adminPreHandler }, adminController.deleteComment);
}
