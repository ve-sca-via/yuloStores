import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Restaurant from "../../models/restaurant.js";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDir = path.resolve(__dirname, "../../../client/qrClient");

async function serveMenuHtml(_request, reply) {
  try {
    const html = await readFile(path.join(clientDir, "index.html"), "utf-8");

    return reply.type("text/html; charset=utf-8").send(html);
  } catch (error) {
    logger.error(`Unable to serve menu HTML: ${error.message}`);

    return reply.code(500).send("Unable to load menu page");
  }
}

async function serveMenuCss(_request, reply) {
  try {
    const css = await readFile(path.join(clientDir, "index.css"), "utf-8");

    return reply.type("text/css; charset=utf-8").send(css);
  } catch (error) {
    logger.error(`Unable to serve menu CSS: ${error.message}`);

    return reply.code(500).send("Unable to load menu styles");
  }
}

async function serveMenuJs(_request, reply) {
  try {
    const js = await readFile(path.join(clientDir, "index.js"), "utf-8");

    return reply
      .type("application/javascript; charset=utf-8")
      .send(js);
  } catch (error) {
    logger.error(`Unable to serve menu JS: ${error.message}`);

    return reply.code(500).send("Unable to load menu script");
  }
}

async function getRestaurantMenu(request, reply) {
  try {
    const restaurantId = request.params.restaurantId?.trim?.();

    if (!restaurantId) {
      return reply.code(400).send({
        status: "error",
        message: "restaurantId is required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    return reply.send({
      status: "success",
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          owner: restaurant.owner,
          recipies: (restaurant.recipies ?? []).map((item) => ({
            id: item._id,
            title: item.title,
            ingredients: item.ingredients ?? [],
            price: item.price,
          })),
        },
      },
    });
  } catch (error) {
    logger.error(`Unable to fetch restaurant menu: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch restaurant menu",
    });
  }
}

export { getRestaurantMenu, serveMenuCss, serveMenuHtml, serveMenuJs };
