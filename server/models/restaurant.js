import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "RestaurantOwner",
    required: true,
  },
  recipies: [
    {
      title: { type: String, required: true },
      ingredients: [{ type: String }],
      price: { type: Number, required: true },
    },
  ],
  inventory: [
    {
      name: { type: String, required: true, trim: true },
      quantity: { type: Number, required: true, min: 0 },
      unit: { type: String, trim: true, default: "kg" },
      price: { type: Number, required: true, min: 0 },
      available: { type: Boolean, required: true, default: true },
    },
  ],
  inventoryMovements: [
    {
      inventory_id: { type: mongoose.Schema.Types.ObjectId, required: true },
      inventoryName: { type: String, required: true, trim: true },
      type: {
        type: String,
        required: true,
        enum: ["restock", "usage", "waste", "manual_adjustment"],
      },
      quantityChange: { type: Number, required: true },
      resultingQuantity: { type: Number, required: true, min: 0 },
      unit: { type: String, trim: true, default: "kg" },
      price: { type: Number, required: true, min: 0 },
      note: { type: String, trim: true, default: "" },
      createdAt: { type: Date, default: Date.now, required: true },
    },
  ],
  expenses: [
    {
      title: { type: String, required: true, trim: true },
      amount: { type: Number, required: true, min: 0 },
      tags: [{ type: String, trim: true }],
      note: { type: String, trim: true, default: "" },
      createdAt: { type: Date, default: Date.now, required: true },
    },
  ],
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
