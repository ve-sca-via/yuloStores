import logger from "../../utils/logger.js";
import Restaurant from "../../models/restaurant.js";
import RestaurantOwner from "../../models/restaurantOwner.js";

function getBaseUrl(request, inputBaseUrl) {
  const baseUrl = inputBaseUrl?.trim?.() || process.env.CUSTOMER_APP_URL;

  if (baseUrl) {
    return baseUrl.replace(/\/$/, "");
  }

  const protocol =
    request.headers["x-forwarded-proto"] ?? request.protocol ?? "http";
  const host = request.headers["x-forwarded-host"] ?? request.headers.host;

  return `${protocol}://${host}`;
}

async function generateQr(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId = request.ownerId;
    const tableNumber = reqBody.tableNumber?.toString?.().trim();

    if (!tableNumber) {
      logger.warn("QR generation failed: missing ownerId or table number");

      return reply.code(400).send({
        status: "error",
        message: "tableNumber and a logged-in owner are required",
      });
    }

    const owner = await RestaurantOwner.findById(ownerId);

    if (!owner) {
      logger.warn(`QR generation failed: owner not found ${ownerId}`);

      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    if (!owner.restaurant) {
      logger.warn(
        `QR generation failed: no restaurant registered for owner ${ownerId}`,
      );

      return reply.code(404).send({
        status: "error",
        message: "Restaurant not registered for this owner",
      });
    }

    const restaurant = await Restaurant.findById(owner.restaurant);

    if (!restaurant) {
      logger.warn(
        `QR generation failed: restaurant not found for owner ${ownerId}`,
      );

      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    const registeredTables = Array.isArray(restaurant.validTables)
      ? restaurant.validTables
      : [];

    if (!registeredTables.includes(tableNumber)) {
      restaurant.validTables = [...registeredTables, tableNumber];
      await restaurant.save();
    }

    const menuUrl = new URL("/menu", getBaseUrl(request, reqBody.baseUrl));
    menuUrl.searchParams.set("restaurantId", restaurant._id.toString());
    menuUrl.searchParams.set("tableNumber", tableNumber);

    const qrImageUrl = new URL("https://api.qrserver.com/v1/create-qr-code/");
    qrImageUrl.searchParams.set(
      "size",
      reqBody.size?.toString?.().trim() || "300x300",
    );
    qrImageUrl.searchParams.set("data", menuUrl.toString());

    logger.info(
      `QR generated successfully for restaurant: ${restaurant._id}, table: ${tableNumber}`,
    );

    return reply.code(201).send({
      status: "success",
      message: "QR generated successfully",
      data: {
        restaurantId: restaurant._id,
        tableNumber,
        link: menuUrl.toString(),
        qrImageUrl: qrImageUrl.toString(),
      },
    });
  } catch (error) {
    logger.error(`Error from generateQr function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to generate QR",
    });
  }
}

export { generateQr };
