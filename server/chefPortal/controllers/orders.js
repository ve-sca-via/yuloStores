import Order from "../../models/orders.js";
import Restaurant from "../../models/restaurant.js";
import logger from "../../utils/logger.js";

async function getChefOrders(request, reply) {
  try {
    const restaurantId =
      request.query.restaurant_id?.toString?.().trim() ??
      request.query.restaurantId?.toString?.().trim();

    if (!restaurantId) {
      return reply.code(400).send({
        status: "error",
        message: "restaurant_id query parameter is required",
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
    logger.error(`Unable to fetch chef orders: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch chef orders",
    });
  }
}

async function updateChefOrderStatus(request, reply) {
  try {
    const orderId = request.params.orderId?.toString?.().trim();
    const restaurantId =
      request.body?.restaurantId?.toString?.().trim() ??
      request.body?.restaurant_id?.toString?.().trim();
    const orderStatus = request.body?.orderStatus?.toString?.().trim();
    const allowedStatuses = ["preparing", "completed", "cancelled"];

    if (!orderId || !restaurantId || !orderStatus) {
      return reply.code(400).send({
        status: "error",
        message: "orderId, restaurantId and orderStatus are required",
      });
    }

    if (!allowedStatuses.includes(orderStatus)) {
      return reply.code(400).send({
        status: "error",
        message: "Chef can only set preparing, completed or cancelled",
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

    order.orderStatus = orderStatus;
    await order.save();

    return reply.send({
      status: "success",
      message: "Chef order status updated successfully",
      data: {
        order: {
          id: order._id,
          orderStatus: order.orderStatus,
        },
      },
    });
  } catch (error) {
    logger.error(`Unable to update chef order status: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to update chef order status",
    });
  }
}

export { getChefOrders, updateChefOrderStatus };
