import { serverHealth } from './controllers/serverHealth.js';
import { restaurentOwnerLogin, restaurentOwnerSignup } from './controllers/auths.js';
import { addItems, registerRestaurants } from './controllers/addItems.js';

const restaurantOwnerRoutes = (app) => {
  app.get('/health', serverHealth);
  app.post('/restaurant_owner/signup', restaurentOwnerSignup);
  app.post('/restaurant_owner/login', restaurentOwnerLogin);
  app.post('/restaurant_owner/register_restaurant', registerRestaurants);
  app.post('/restaurant_owner/add_item', addItems);
};

export default restaurantOwnerRoutes;
