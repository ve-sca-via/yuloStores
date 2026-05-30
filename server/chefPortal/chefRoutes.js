import {
  getRestaurantMenu,
  serveClientApp,
} from "../restaurantOwner/controllers/menu.js";
import {
  getChefOrders,
  updateChefOrderStatus,
} from "./controllers/orders.js";

const chefRoutes = (app) => {
  app.get("/chef", serveClientApp);
  app.get("/chef/orders", getChefOrders);
  app.patch("/chef/orders/:orderId/status", updateChefOrderStatus);
  app.get("/chef/restaurants/:restaurantId/menu", getRestaurantMenu);
};

export default chefRoutes;
