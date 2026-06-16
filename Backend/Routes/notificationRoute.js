import * as notificationController from '../Controllers/notificationController.js';
import * as viewController from '../Controllers/viewController.js';
import { authentication } from '../Middlewares/authentication.js';

export function notificationRoute(fastify, option){
    fastify.get('/notifications', { preHandler: authentication }, viewController.getNotificationPage);
    fastify.get('/api/notifications', { preHandler: authentication }, notificationController.getNotifications);
    fastify.get('/api/notifications/unread-count', { preHandler: authentication }, notificationController.getUnreadCount);
    fastify.put('/api/notifications/:id/read', { preHandler: authentication }, notificationController.markAsRead);
    fastify.put('/api/notifications/read-all', { preHandler: authentication }, notificationController.markAllAsRead);
    fastify.delete('/api/notifications/:id', { preHandler: authentication }, notificationController.deleteNotification);
}
