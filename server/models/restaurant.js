import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const staffMemberSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      enum: ["chef", "waiter"],
    },
    name: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    employeeId: { type: String, trim: true, lowercase: true, default: "" },
    password: { type: String, default: "" },
  },
  {
    timestamps: true,
  },
);

// Subdocument save hooks run when the parent restaurant is saved. The
// isModified guard means existing members are never re-hashed on unrelated
// restaurant updates (inventory, menu, etc.).
staffMemberSchema.pre("save", async function hashStaffPassword() {
  if (!this.isModified("password") || !this.password) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

staffMemberSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

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
  validTables: [
    {
      type: String,
      trim: true,
    },
  ],
  staffMembers: [staffMemberSchema],
});

const Restaurant = mongoose.model("Restaurant", restaurantSchema);

export default Restaurant;
