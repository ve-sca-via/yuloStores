import { serverHealth } from './controllers/serverHealth.js';
import { restaurentOwnerLogin, restaurentOwnerSignup } from './controllers/auths.js';
import { registerRestaurants } from './controllers/addItems.js';

const restaurantOwnerRoutes = (app) => {
  app.get('/health', serverHealth);
  app.post('/restaurant-owner/signup', restaurentOwnerSignup);
  app.post('/restaurant-owner/login', restaurentOwnerLogin);
  app.post('/restaurant-owner/register-restaurant', registerRestaurants);
};

export default restaurantOwnerRoutes;
