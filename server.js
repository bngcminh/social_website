const fastify = require('fastify')({ logger: true });

fastify.get('/', function(req, rep){
    rep.send('Run!')
});

fastify.listen({ port: 3000 }, (err) => {})