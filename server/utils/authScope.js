import RestaurantOwner from "../models/restaurantOwner.js";

/**
 * Returns the restaurant id the authenticated caller is allowed to act on,
 * derived entirely from the verified token — never from client-supplied
 * query/body params. Returns null if the caller has no associated restaurant.
 *
 *   owner    -> their own restaurant (looked up from the owner record)
 *   employee -> the restaurantId embedded in their token at login
 */
async function resolveCallerRestaurantId(request) {
  const user = request.user;

  if (!user) {
    return null;
  }

  if (user.type === "employee") {
    return user.restaurantId ?? null;
  }

  if (user.type === "owner") {
    const owner = await RestaurantOwner.findById(user.sub)
      .select("restaurant")
      .lean();

    return owner?.restaurant ? owner.restaurant.toString() : null;
  }

  return null;
}

export { resolveCallerRestaurantId };
