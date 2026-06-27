import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  restaurant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  tag: {
    type: String,
    trim: true,
    default: "",
  },
  tags: [
    {
      type: String,
      trim: true,
    },
  ],
  note: {
    type: String,
    trim: true,
    default: "",
  },
  time: {
    type: Date,
    default: Date.now,
    required: true,
  },
});

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
