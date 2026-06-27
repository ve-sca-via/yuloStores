import { serverHealth } from "./controllers/serverHealth.js";
import {
  getRestaurantOwnerProfile,
  restaurentOwnerLogin,
  restaurentOwnerSignup,
  restaurantOwnerLogout,
  updateRestaurantOwnerProfile,
} from "./controllers/auths.js";
import {
  addStaffMember,
  addExpense,
  addInventory,
  addInventoryMovement,
  addItems,
  deleteStaffMember,
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
  addEmployeeMember,
  loginEmployeeMember,
} from "./controllers/members.js";
import {
  createOrder,
  generateOrderBill,
  getOrdersByRestaurant,
  updateOrderPaymentStatus,
} from "./controllers/orders.js";
import schemas from "../validation/schemas.js";

const restaurantOwnerRoutes = (app) => {
  // Owner-only options: verify the JWT (sets request.ownerId), plus a schema.
  const owner = { preHandler: app.requireOwner };
  const ownerWith = (schema) => ({ preHandler: app.requireOwner, schema });

  // Stricter rate limit for credential endpoints to blunt brute-force attempts.
  const authLimit = {
    config: {
      rateLimit: {
        max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 10,
        timeWindow: process.env.AUTH_RATE_LIMIT_WINDOW || "1 minute",
      },
    },
  };

  // --- Public routes (no auth) ---
  app.get("/health", serverHealth);
  app.get("/assets/*", serveClientAsset);
  app.get("/menu", serveClientApp);
  app.get("/owner", serveClientApp);
  app.get("/api/restaurants/:restaurantId/menu", getRestaurantMenu);
  app.post("/api/orders", { schema: schemas.createOrder }, createOrder);
  app.post(
    "/restaurant_owner/signup",
    { ...authLimit, schema: schemas.ownerSignup },
    restaurentOwnerSignup,
  );
  app.post(
    "/restaurant_owner/login",
    { ...authLimit, schema: schemas.ownerLogin },
    restaurentOwnerLogin,
  );
  app.post("/restaurant_owner/logout", restaurantOwnerLogout);
  app.post(
    "/restaurant_owner/employees/login",
    { ...authLimit, schema: schemas.employeeLogin },
    loginEmployeeMember,
  );

  // --- Owner-only routes (require a valid owner token) ---
  app.get("/api/orders", owner, getOrdersByRestaurant);
  app.get("/restaurant_owner/orders", owner, getOrdersByRestaurant);
  app.get("/restaurant_owner/orders/:orderId/bill", owner, generateOrderBill);
  app.patch(
    "/restaurant_owner/orders/:orderId/payment",
    ownerWith(schemas.updatePayment),
    updateOrderPaymentStatus,
  );
  app.get("/restaurant_owner/profile", owner, getRestaurantOwnerProfile);
  app.patch(
    "/restaurant_owner/profile/:ownerId",
    ownerWith(schemas.ownerProfileUpdate),
    updateRestaurantOwnerProfile,
  );
  app.post(
    "/restaurant_owner/register_restaurant",
    ownerWith(schemas.restaurantName),
    registerRestaurants,
  );
  app.patch(
    "/restaurant_owner/restaurant",
    ownerWith(schemas.restaurantName),
    updateRestaurant,
  );
  app.post(
    "/restaurant_owner/employees",
    ownerWith(schemas.addEmployee),
    addEmployeeMember,
  );
  app.post(
    "/restaurant_owner/members",
    ownerWith(schemas.addStaffMember),
    addStaffMember,
  );
  app.delete("/restaurant_owner/members/:memberId", owner, deleteStaffMember);
  app.post("/restaurant_owner/add_item", ownerWith(schemas.addItem), addItems);
  app.patch(
    "/restaurant_owner/menu/:itemId",
    ownerWith(schemas.addItem),
    updateMenuItem,
  );
  app.delete("/restaurant_owner/menu/:itemId", owner, deleteMenuItem);
  app.post(
    "/restaurant_owner/add_expense",
    ownerWith(schemas.addExpense),
    addExpense,
  );
  app.get("/restaurant_owner/expenses", owner, getExpenses);
  app.delete("/restaurant_owner/expenses/:expenseId", owner, deleteExpense);
  app.post(
    "/restaurant_owner/add_inventory",
    ownerWith(schemas.addInventory),
    addInventory,
  );
  app.get("/restaurant_owner/inventory", owner, getInventory);
  app.patch(
    "/restaurant_owner/inventory/:inventoryId",
    ownerWith(schemas.addInventory),
    updateInventoryItem,
  );
  app.delete(
    "/restaurant_owner/inventory/:inventoryId",
    owner,
    deleteInventoryItem,
  );
  app.post(
    "/restaurant_owner/inventory/:inventoryId/movements",
    ownerWith(schemas.inventoryMovement),
    addInventoryMovement,
  );
  app.get("/restaurant_owner/analytics", owner, getRestaurantAnalytics);
  app.get("/api/restaurant_owner/analytics", owner, getRestaurantAnalytics);
  app.post(
    "/restaurant_owner/generate_qr",
    ownerWith(schemas.generateQr),
    generateQr,
  );
};

export default restaurantOwnerRoutes;
