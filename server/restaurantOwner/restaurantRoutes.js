import { serverHealth } from "./controllers/serverHealth.js";
import {
  getRestaurantOwnerProfile,
  restaurentOwnerLogin,
  restaurentOwnerSignup,
  restaurantOwnerLogout,
  updateRestaurantOwnerProfile,
} from "./controllers/auths.js";
import {
  addExpense,
  addInventory,
  addInventoryMovement,
  addItems,
  deleteExpense,
  deleteMenuItem,
  deleteInventoryItem,
  getExpenses,
  getInventory,
  getRestaurantAnalytics,
  registerRestaurants,
  updateMenuItem,
  updateRestaurant,
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
  generateOrderBill,
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
  app.get("/restaurant_owner/orders/:orderId/bill", generateOrderBill);
  app.patch("/restaurant_owner/orders/:orderId/payment", updateOrderPaymentStatus);
  app.post("/restaurant_owner/signup", restaurentOwnerSignup);
  app.post("/restaurant_owner/login", restaurentOwnerLogin);
  app.post("/restaurant_owner/logout", restaurantOwnerLogout);
  app.get("/restaurant_owner/profile", getRestaurantOwnerProfile);
  app.patch("/restaurant_owner/profile/:ownerId", updateRestaurantOwnerProfile);
  app.post("/restaurant_owner/register_restaurant", registerRestaurants);
  app.patch("/restaurant_owner/restaurant", updateRestaurant);
  app.post("/restaurant_owner/add_item", addItems);
  app.patch("/restaurant_owner/menu/:itemId", updateMenuItem);
  app.delete("/restaurant_owner/menu/:itemId", deleteMenuItem);
  app.post("/restaurant_owner/add_expense", addExpense);
  app.get("/restaurant_owner/expenses", getExpenses);
  app.delete("/restaurant_owner/expenses/:expenseId", deleteExpense);
  app.post("/restaurant_owner/add_inventory", addInventory);
  app.get("/restaurant_owner/inventory", getInventory);
  app.patch("/restaurant_owner/inventory/:inventoryId", updateInventoryItem);
  app.delete("/restaurant_owner/inventory/:inventoryId", deleteInventoryItem);
  app.post(
    "/restaurant_owner/inventory/:inventoryId/movements",
    addInventoryMovement,
  );
  app.get("/restaurant_owner/analytics", getRestaurantAnalytics);
  app.get("/api/restaurant_owner/analytics", getRestaurantAnalytics);
  app.post("/restaurant_owner/generate_qr", generateQr);
};

export default restaurantOwnerRoutes;
