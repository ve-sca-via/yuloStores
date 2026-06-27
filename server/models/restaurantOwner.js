import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

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

// Hash the password whenever it is set or changed, so a plaintext password
// can never reach the database — regardless of which controller saved it.
restaurantOwnerSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// findByIdAndUpdate / findOneAndUpdate skip the document "save" hook, so hash
// the password here too when a profile update changes it.
restaurantOwnerSchema.pre("findOneAndUpdate", async function hashUpdate() {
  const update = this.getUpdate();
  const nextPassword = update?.password ?? update?.$set?.password;

  if (!nextPassword) {
    return;
  }

  const hashed = await bcrypt.hash(nextPassword, SALT_ROUNDS);

  if (update.$set?.password) {
    update.$set.password = hashed;
  } else {
    update.password = hashed;
  }

  this.setUpdate(update);
});

restaurantOwnerSchema.methods.comparePassword = function comparePassword(
  candidatePassword,
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const RestaurantOwner = mongoose.model(
  "RestaurantOwner",
  restaurantOwnerSchema,
);

export default RestaurantOwner;
