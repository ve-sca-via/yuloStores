import { serverHealth } from "./controllers/serverHealth.js";
import {
  restaurentOwnerLogin,
  restaurentOwnerSignup,
} from "./controllers/auths.js";
import { addItems, registerRestaurants } from "./controllers/addItems.js";
import { generateQr } from "./controllers/qrGeneration.js";
import {
  getRestaurantMenu,
  serveMenuCss,
  serveMenuHtml,
  serveMenuJs,
} from "./controllers/menu.js";
import { createOrder, getOrdersByRestaurant } from "./controllers/orders.js";

const restaurantOwnerRoutes = (app) => {
  app.get("/health", serverHealth);
  app.get("/menu", serveMenuHtml);
  app.get("/menu/index.css", serveMenuCss);
  app.get("/menu/index.js", serveMenuJs);
  app.get("/api/restaurants/:restaurantId/menu", getRestaurantMenu);
  app.get("/api/orders", getOrdersByRestaurant);
  app.get("/restaurant_owner/orders", getOrdersByRestaurant);
  app.post("/api/orders", createOrder);
  app.post("/restaurant_owner/signup", restaurentOwnerSignup);
  app.post("/restaurant_owner/login", restaurentOwnerLogin);
  app.post("/restaurant_owner/register_restaurant", registerRestaurants);
  app.post("/restaurant_owner/add_item", addItems);
  app.post("/restaurant_owner/generate_qr", generateQr);
};

export default restaurantOwnerRoutes;
