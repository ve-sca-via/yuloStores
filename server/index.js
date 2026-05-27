import fastify from 'fastify';
import restaurantOwnerRoutes from './restaurantOwner/restaurantRoutes.js';
import logger from './utils/logger.js';

const app = fastify({
  logger: true,
});

app.get('/', async () => {
  return { message: 'Server is running' };
});

app.register(restaurantOwnerRoutes);

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    logger.info('Server started on http://0.0.0.0:3000');
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
