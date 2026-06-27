import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Restaurant from "../../models/restaurant.js";
import logger from "../../utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistDir = path.resolve(__dirname, "../../../client/dist");
const clientEntryFile = path.join(clientDistDir, "index.html");

function getContentType(filePath) {
  const extension = path.extname(filePath);

  if (extension === ".js") {
    return "application/javascript; charset=utf-8";
  }

  if (extension === ".css") {
    return "text/css; charset=utf-8";
  }

  if (extension === ".svg") {
    return "image/svg+xml";
  }

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".jpg" || extension === ".jpeg") {
    return "image/jpeg";
  }

  if (extension === ".json") {
    return "application/json; charset=utf-8";
  }

  return "text/plain; charset=utf-8";
}

async function serveClientApp(_request, reply) {
  try {
    const html = await readFile(clientEntryFile, "utf-8");

    return reply.type("text/html; charset=utf-8").send(html);
  } catch (error) {
    logger.error(`Unable to serve client application: ${error.message}`);

    return reply
      .code(500)
      .send(
        "Client build not found. Run the Vite build before serving from the API.",
      );
  }
}

async function serveClientAsset(request, reply) {
  try {
    const assetPath = request.params["*"]?.toString?.() ?? "";
    const resolvedPath = path.resolve(clientDistDir, "assets", assetPath);

    if (!resolvedPath.startsWith(clientDistDir)) {
      return reply.code(400).send("Invalid asset path");
    }

    const file = await readFile(resolvedPath);

    return reply.type(getContentType(resolvedPath)).send(file);
  } catch (error) {
    logger.error(`Unable to serve client asset: ${error.message}`);

    return reply.code(404).send("Asset not found");
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

export { getRestaurantMenu, serveClientApp, serveClientAsset };
