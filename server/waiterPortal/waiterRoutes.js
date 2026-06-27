import {
  getRestaurantMenu,
  serveClientApp,
} from "../restaurantOwner/controllers/menu.js";
import { updateOrderPaymentStatus } from "../restaurantOwner/controllers/orders.js";
import {
  createOrAppendWaiterOrder,
  getPendingWaiterOrder,
} from "./controllers/orders.js";
import schemas from "../validation/schemas.js";

const waiterRoutes = (app) => {
  const waiter = { preHandler: app.requireWaiter };

  app.get("/waiter", serveClientApp); // serves the SPA shell (public)
  app.get("/waiter/restaurants/:restaurantId/menu", getRestaurantMenu); // public menu read
  app.get("/waiter/orders/pending", waiter, getPendingWaiterOrder);
  app.post(
    "/waiter/orders",
    { preHandler: app.requireWaiter, schema: schemas.waiterOrder },
    createOrAppendWaiterOrder,
  );
  app.patch(
    "/waiter/orders/:orderId/payment",
    { preHandler: app.requireWaiter, schema: schemas.updatePayment },
    updateOrderPaymentStatus,
  );
};

export default waiterRoutes;
