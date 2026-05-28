import * as searchController from '../Controllers/searchController.js';
import { authentication } from '../Middlewares/authentication.js';

export function searchRoute(fastify, option){
    fastify.get('/search', { preHandler: authentication }, searchController.searchInformation);
}