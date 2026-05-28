import mongoose from "mongoose";

const restaurantOwnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
  },
  {
    timestamps: true,
  },
);

const RestaurantOwner = mongoose.model(
  "RestaurantOwner",
  restaurantOwnerSchema,
);

export default RestaurantOwner;
