import {
  getRestaurantMenu,
  serveClientApp,
} from "../restaurantOwner/controllers/menu.js";
import {
  getChefOrders,
  updateChefOrderStatus,
} from "./controllers/orders.js";
import schemas from "../validation/schemas.js";

const chefRoutes = (app) => {
  const chef = { preHandler: app.requireChef };

  app.get("/chef", serveClientApp); // serves the SPA shell (public)
  app.get("/chef/restaurants/:restaurantId/menu", getRestaurantMenu); // public menu read
  app.get("/chef/orders", chef, getChefOrders);
  app.patch(
    "/chef/orders/:orderId/status",
    { preHandler: app.requireChef, schema: schemas.chefOrderStatus },
    updateChefOrderStatus,
  );
};

export default chefRoutes;
