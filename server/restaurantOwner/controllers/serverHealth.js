import logger from '../../utils/logger.js';

async function serverHealth() {
  try {
    logger.info('Health check requested');

    return {
      status: 'ok',
      message: 'Server is working fine',
    };
  } catch (error) {
    logger.error('Health check failed', error);

    return {
      status: 'error',
      message: 'Server is down',
    };
  }
}

export { serverHealth };
