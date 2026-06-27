import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    recipe_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    title: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
  },
  {
    _id: false,
  },
);

const orderSchema = new mongoose.Schema({
  items: {
    type: [orderItemSchema],
    required: true,
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: "Order must contain at least one item",
    },
  },
  totalPrice: { type: Number, required: true, min: 0 },
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  tableNumber: {
    type: String,
    trim: true,
    default: null,
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  orderStatus: {
    type: String,
    required: true,
    enum: ["new", "accepted", "preparing", "ready", "completed", "cancelled"],
    default: "new",
  },
  time: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
