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
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
