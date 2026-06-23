import Order from "../../models/orders.js";
import Restaurant from "../../models/restaurant.js";
import logger from "../../utils/logger.js";
import { resolveCallerRestaurantId } from "../../utils/authScope.js";

function normalizeRequestedItems(items) {
  const quantityByRecipeId = new Map();

  for (const item of items) {
    const recipeId = item?.recipeId?.toString?.().trim();
    const quantity = Number(item?.quantity);

    if (!recipeId || !Number.isInteger(quantity) || quantity < 1) {
      return null;
    }

    quantityByRecipeId.set(
      recipeId,
      (quantityByRecipeId.get(recipeId) ?? 0) + quantity,
    );
  }

  return Array.from(quantityByRecipeId.entries()).map(
    ([recipeId, quantity]) => ({
      recipeId,
      quantity,
    }),
  );
}

function serializeOrder(order) {
  return {
    id: order._id,
    items: (order.items ?? []).map((item) => ({
      recipeId: item.recipe_id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.quantity * item.price,
    })),
    totalPrice: order.totalPrice,
    restaurant_id: order.restaurant_id,
    tableNumber: order.tableNumber,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    time: order.time,
  };
}

function buildMenuItems(restaurant, requestedItems) {
  const recipeMap = new Map(
    (restaurant.recipies ?? []).map((recipe) => [recipe._id.toString(), recipe]),
  );

  const normalizedItems = requestedItems
    .map((item) => {
      const recipe = recipeMap.get(item.recipeId);

      if (!recipe) {
        return null;
      }

      return {
        recipe_id: recipe._id,
        title: recipe.title,
        quantity: item.quantity,
        price: recipe.price,
      };
    })
    .filter(Boolean);

  if (
    normalizedItems.length === 0 ||
    normalizedItems.length !== requestedItems.length
  ) {
    return null;
  }

  return normalizedItems;
}

function mergeOrderItems(existingItems, newItems) {
  const mergedItems = new Map();

  for (const item of existingItems) {
    mergedItems.set(item.recipe_id.toString(), {
      recipe_id: item.recipe_id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
    });
  }

  for (const item of newItems) {
    const key = item.recipe_id.toString();
    const existingItem = mergedItems.get(key);

    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      mergedItems.set(key, { ...item });
    }
  }

  return Array.from(mergedItems.values());
}

function isValidRestaurantTable(restaurant, tableNumber) {
  const validTables = restaurant.validTables ?? [];

  // Older restaurants may have QR links generated before table registration
  // started being persisted. In that case, allow waiter lookup/order flow.
  if (validTables.length === 0) {
    return true;
  }

  return validTables.includes(tableNumber);
}

async function getPendingWaiterOrder(request, reply) {
  try {
    const restaurantId = await resolveCallerRestaurantId(request);
    const tableNumber = request.query.tableNumber?.toString?.().trim();

    if (!tableNumber) {
      return reply.code(400).send({
        status: "error",
        message: "tableNumber query parameter is required",
      });
    }

    if (!restaurantId) {
      return reply.code(404).send({
        status: "error",
        message: "No restaurant is associated with this account",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    if (!isValidRestaurantTable(restaurant, tableNumber)) {
      return reply.code(400).send({
        status: "error",
        message: "Please enter valid table Number",
      });
    }

    const order = await Order.findOne({
      restaurant_id: restaurantId,
      tableNumber,
      paymentStatus: "pending",
      orderStatus: { $ne: "cancelled" },
    })
      .sort({ time: -1 })
      .lean();

    return reply.send({
      status: "success",
      data: {
        order: order ? serializeOrder(order) : null,
      },
    });
  } catch (error) {
    logger.error(`Unable to fetch waiter pending order: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch pending order",
    });
  }
}

async function createOrAppendWaiterOrder(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const restaurantId = await resolveCallerRestaurantId(request);
    const tableNumber = reqBody.tableNumber?.toString?.().trim();
    const items = Array.isArray(reqBody.items) ? reqBody.items : [];

    if (!tableNumber || items.length === 0) {
      return reply.code(400).send({
        status: "error",
        message: "tableNumber and at least one item are required",
      });
    }

    if (!restaurantId) {
      return reply.code(404).send({
        status: "error",
        message: "No restaurant is associated with this account",
      });
    }

    const requestedItems = normalizeRequestedItems(items);

    if (!requestedItems) {
      return reply.code(400).send({
        status: "error",
        message: "Each item must include a valid recipeId and quantity",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    if (!isValidRestaurantTable(restaurant, tableNumber)) {
      return reply.code(400).send({
        status: "error",
        message: "Please enter valid table Number",
      });
    }

    const normalizedItems = buildMenuItems(restaurant, requestedItems);

    if (!normalizedItems) {
      return reply.code(400).send({
        status: "error",
        message: "One or more selected items are invalid",
      });
    }

    const existingOrder = await Order.findOne({
      restaurant_id: restaurantId,
      tableNumber,
      paymentStatus: "pending",
      orderStatus: { $ne: "cancelled" },
    }).sort({ time: -1 });

    if (existingOrder) {
      existingOrder.items = mergeOrderItems(
        existingOrder.items ?? [],
        normalizedItems,
      );
      existingOrder.totalPrice = existingOrder.items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
      );
      existingOrder.orderStatus = "new";
      existingOrder.time = new Date();
      await existingOrder.save();

      logger.info(`Waiter updated pending order: ${existingOrder._id}`);

      return reply.send({
        status: "success",
        message: "Items added to the pending order",
        data: {
          action: "updated",
          order: serializeOrder(existingOrder),
        },
      });
    }

    const totalPrice = normalizedItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );

    const order = await Order.create({
      items: normalizedItems,
      totalPrice,
      restaurant_id: restaurant._id,
      tableNumber,
      paymentStatus: "pending",
      orderStatus: "new",
    });

    logger.info(`Waiter created order: ${order._id}`);

    return reply.code(201).send({
      status: "success",
      message: "Order created successfully",
      data: {
        action: "created",
        order: serializeOrder(order),
      },
    });
  } catch (error) {
    logger.error(`Unable to create waiter order: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to save waiter order",
    });
  }
}

export { createOrAppendWaiterOrder, getPendingWaiterOrder };
