import { serverHealth } from "./controllers/serverHealth.js";
import {
  restaurentOwnerLogin,
  restaurentOwnerSignup,
} from "./controllers/auths.js";
import {
  addInventory,
  addItems,
  deleteInventoryItem,
  getInventory,
  registerRestaurants,
  updateInventoryItem,
} from "./controllers/addItems.js";
import { generateQr } from "./controllers/qrGeneration.js";
import {
  getRestaurantMenu,
  serveClientApp,
  serveClientAsset,
} from "./controllers/menu.js";
import {
  createOrder,
  getOrdersByRestaurant,
  updateOrderPaymentStatus,
} from "./controllers/orders.js";

const restaurantOwnerRoutes = (app) => {
  app.get("/health", serverHealth);
  app.get("/assets/*", serveClientAsset);
  app.get("/menu", serveClientApp);
  app.get("/owner", serveClientApp);
  app.get("/api/restaurants/:restaurantId/menu", getRestaurantMenu);
  app.get("/api/orders", getOrdersByRestaurant);
  app.get("/restaurant_owner/orders", getOrdersByRestaurant);
  app.post("/api/orders", createOrder);
  app.patch("/restaurant_owner/orders/:orderId/payment", updateOrderPaymentStatus);
  app.post("/restaurant_owner/signup", restaurentOwnerSignup);
  app.post("/restaurant_owner/login", restaurentOwnerLogin);
  app.post("/restaurant_owner/register_restaurant", registerRestaurants);
  app.post("/restaurant_owner/add_item", addItems);
  app.post("/restaurant_owner/add_inventory", addInventory);
  app.get("/restaurant_owner/inventory", getInventory);
  app.patch("/restaurant_owner/inventory/:inventoryId", updateInventoryItem);
  app.delete("/restaurant_owner/inventory/:inventoryId", deleteInventoryItem);
  app.post("/restaurant_owner/generate_qr", generateQr);
};

export default restaurantOwnerRoutes;
