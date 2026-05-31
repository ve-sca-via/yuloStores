import {
  getRestaurantMenu,
  serveClientApp,
} from "../restaurantOwner/controllers/menu.js";
import { updateOrderPaymentStatus } from "../restaurantOwner/controllers/orders.js";
import {
  createOrAppendWaiterOrder,
  getPendingWaiterOrder,
} from "./controllers/orders.js";

const waiterRoutes = (app) => {
  app.get("/waiter", serveClientApp);
  app.get("/waiter/orders/pending", getPendingWaiterOrder);
  app.post("/waiter/orders", createOrAppendWaiterOrder);
  app.patch("/waiter/orders/:orderId/payment", updateOrderPaymentStatus);
  app.get("/waiter/restaurants/:restaurantId/menu", getRestaurantMenu);
};

export default waiterRoutes;
