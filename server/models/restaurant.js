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
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
