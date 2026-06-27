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

async function createOrder(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const restaurantId = reqBody.restaurantId?.trim?.();
    const tableNumber = reqBody.tableNumber?.toString?.().trim() ?? null;
    const items = Array.isArray(reqBody.items) ? reqBody.items : [];

    if (!restaurantId || items.length === 0) {
      return reply.code(400).send({
        status: "error",
        message: "restaurantId and at least one item are required",
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

    const recipeMap = new Map(
      (restaurant.recipies ?? []).map((recipe) => [
        recipe._id.toString(),
        recipe,
      ]),
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
      return reply.code(400).send({
        status: "error",
        message: "One or more selected items are invalid",
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

    logger.info(
      `Order created successfully for restaurant: ${restaurant._id}, order: ${order._id}`,
    );

    return reply.code(201).send({
      status: "success",
      message: "Order created successfully",
      data: {
        order: {
          id: order._id,
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
          },
          items: order.items.map((item) => ({
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
        },
      },
    });
  } catch (error) {
    logger.error(`Unable to create order: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to create order",
    });
  }
}

async function getOrdersByRestaurant(request, reply) {
  try {
    // Scope to the caller's own restaurant, taken from the verified token.
    const restaurantId = await resolveCallerRestaurantId(request);

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

    const orders = await Order.find({ restaurant_id: restaurantId })
      .sort({ time: -1 })
      .lean();

    return reply.send({
      status: "success",
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
        totalOrders: orders.length,
        orders: orders.map((order) => ({
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
        })),
      },
    });
  } catch (error) {
    logger.error(`Unable to fetch restaurant orders: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch restaurant orders",
    });
  }
}

async function updateOrderPaymentStatus(request, reply) {
  try {
    const orderId = request.params.orderId?.toString?.().trim();
    const reqBody = request.body ?? {};
    const paymentStatus = reqBody.paymentStatus?.toString?.().trim();
    const restaurantId = await resolveCallerRestaurantId(request);

    if (!orderId || !paymentStatus) {
      return reply.code(400).send({
        status: "error",
        message: "orderId and paymentStatus are required",
      });
    }

    if (!restaurantId) {
      return reply.code(404).send({
        status: "error",
        message: "No restaurant is associated with this account",
      });
    }

    if (paymentStatus !== "paid") {
      return reply.code(400).send({
        status: "error",
        message: "Only paid status updates are supported",
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return reply.code(404).send({
        status: "error",
        message: "Order not found",
      });
    }

    if (order.restaurant_id.toString() !== restaurantId) {
      return reply.code(403).send({
        status: "error",
        message: "This order does not belong to the provided restaurant",
      });
    }

    if (order.paymentStatus === "paid") {
      return reply.send({
        status: "success",
        message: "Order is already marked as paid",
        data: {
          order: {
            id: order._id,
            paymentStatus: order.paymentStatus,
          },
        },
      });
    }

    order.paymentStatus = "paid";
    await order.save();

    logger.info(`Order marked as paid: ${order._id}`);

    return reply.send({
      status: "success",
      message: "Order marked as paid successfully",
      data: {
        order: {
          id: order._id,
          paymentStatus: order.paymentStatus,
        },
      },
    });
  } catch (error) {
    logger.error(`Unable to update order payment status: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to update order payment status",
    });
  }
}

async function generateOrderBill(request, reply) {
  try {
    const orderId = request.params.orderId?.toString?.().trim();
    const restaurantId = await resolveCallerRestaurantId(request);

    if (!orderId) {
      return reply.code(400).send({
        status: "error",
        message: "orderId is required",
      });
    }

    if (!restaurantId) {
      return reply.code(404).send({
        status: "error",
        message: "No restaurant is associated with this account",
      });
    }

    const [order, restaurant] = await Promise.all([
      Order.findById(orderId).lean(),
      Restaurant.findById(restaurantId).lean(),
    ]);

    if (!order) {
      return reply.code(404).send({
        status: "error",
        message: "Order not found",
      });
    }

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    if (order.restaurant_id.toString() !== restaurantId) {
      return reply.code(403).send({
        status: "error",
        message: "This order does not belong to the provided restaurant",
      });
    }

    const billItems = (order.items ?? []).map((item) => ({
      recipeId: item.recipe_id,
      title: item.title,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.quantity * item.price,
    }));

    return reply.send({
      status: "success",
      message: "Bill generated successfully",
      data: {
        bill: {
          billNumber: `BILL-${order._id.toString().slice(-6).toUpperCase()}`,
          generatedAt: new Date(),
          restaurant: {
            id: restaurant._id,
            name: restaurant.name,
          },
          order: {
            id: order._id,
            tableNumber: order.tableNumber,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            time: order.time,
          },
          items: billItems,
          subtotal: order.totalPrice,
          total: order.totalPrice,
        },
      },
    });
  } catch (error) {
    logger.error(`Unable to generate order bill: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to generate bill",
    });
  }
}

export {
  createOrder,
  generateOrderBill,
  getOrdersByRestaurant,
  updateOrderPaymentStatus,
};
