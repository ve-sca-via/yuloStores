import logger from "../../utils/logger.js";
import RestaurantOwner from "../../models/restaurantOwner.js";

function serializeRestaurant(restaurant) {
  if (!restaurant) {
    return restaurant;
  }

  return {
    id: restaurant._id,
    name: restaurant.name,
    owner: restaurant.owner,
    recipies: restaurant.recipies ?? [],
    staffMembers: (restaurant.staffMembers ?? []).map((member) => ({
      id: member._id,
      role: member.role,
      name: member.name,
      email: member.email,
      employeeId: member.employeeId,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    })),
  };
}

async function restaurentOwnerSignup(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const name = reqBody.name?.trim();
    const email = reqBody.email?.trim()?.toLowerCase();
    const password = reqBody.password;

    if (!name || !email || !password) {
      logger.warn("Restaurant owner signup failed: missing required fields");

      return reply.code(400).send({
        status: "error",
        message: "Name, email and password are required",
      });
    }

    const existingOwner = await RestaurantOwner.findOne({ email });

    if (existingOwner) {
      logger.warn(
        `Restaurant owner signup failed: email already exists ${email}`,
      );

      return reply.code(409).send({
        status: "error",
        message: "Restaurant owner already exists with this email",
      });
    }

    const owner = await RestaurantOwner.create({
      name,
      email,
      password,
    });

    logger.info(`Restaurant owner signup successful for email: ${email}`);

    const token = await reply.jwtSign({
      sub: owner._id.toString(),
      type: "owner",
    });

    return reply.code(201).send({
      status: "success",
      message: "Restaurant owner created successfully",
      data: {
        token,
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          restaurant: serializeRestaurant(owner.restaurant),
        },
      },
    });
  } catch (error) {
    logger.error(`Error from restaurentOwnerSignup: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to create restaurant owner",
    });
  }
}

async function restaurentOwnerLogin(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const email = reqBody.email?.trim()?.toLowerCase();
    const password = reqBody.password;

    if (!email || !password) {
      logger.warn("Restaurant owner login failed: missing email or password");

      return reply.code(400).send({
        status: "error",
        message: "Email and password are required",
      });
    }

    const owner = await RestaurantOwner.findOne({ email }).populate(
      "restaurant",
    );

    if (!owner || !(await owner.comparePassword(password))) {
      logger.warn(`Restaurant owner login failed for email: ${email}`);

      return reply.code(401).send({
        status: "error",
        message: "Invalid email or password",
      });
    }

    const token = await reply.jwtSign({
      sub: owner._id.toString(),
      type: "owner",
    });

    logger.info(`Restaurant owner login attempt for email: ${email}`);

    return reply.code(200).send({
      status: "success",
      message: "Login successful",
      data: {
        token,
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          restaurant: serializeRestaurant(owner.restaurant),
        },
      },
    });
  } catch (error) {
    logger.error(`Error from restaurantOwnerLogin: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to login restaurant owner",
    });
  }
}

async function getRestaurantOwnerProfile(request, reply) {
  try {
    // Identity comes from the verified token, never the request.
    const ownerId = request.ownerId;

    const owner = await RestaurantOwner.findById(ownerId).populate("restaurant");

    if (!owner) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    return reply.send({
      status: "success",
      data: {
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          restaurant: serializeRestaurant(owner.restaurant),
        },
      },
    });
  } catch (error) {
    logger.error(`Error from getRestaurantOwnerProfile: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch restaurant owner profile",
    });
  }
}

async function updateRestaurantOwnerProfile(request, reply) {
  try {
    // Owners can only edit their own profile — id from the token, not the path.
    const ownerId = request.ownerId;
    const reqBody = request.body ?? {};
    const name = reqBody.name?.trim();
    const email = reqBody.email?.trim?.().toLowerCase();
    const password = reqBody.password;

    if (!name || !email) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId, name and email are required",
      });
    }

    const existingOwner = await RestaurantOwner.findOne({
      email,
      _id: { $ne: ownerId },
    });

    if (existingOwner) {
      return reply.code(409).send({
        status: "error",
        message: "Another restaurant owner already uses this email",
      });
    }

    const update = {
      name,
      email,
    };

    if (password?.length) {
      update.password = password;
    }

    const owner = await RestaurantOwner.findByIdAndUpdate(ownerId, update, {
      new: true,
    }).populate("restaurant");

    if (!owner) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    return reply.send({
      status: "success",
      message: "Owner profile updated successfully",
      data: {
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          restaurant: serializeRestaurant(owner.restaurant),
        },
      },
    });
  } catch (error) {
    logger.error(`Error from updateRestaurantOwnerProfile: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to update restaurant owner profile",
    });
  }
}

async function restaurantOwnerLogout(_request, reply) {
  // With stateless JWTs there is no server-side session to clear; the client
  // discards its stored token. Kept as an endpoint for client compatibility.
  return reply.send({
    status: "success",
    message: "Logout successful",
  });
}

export {
  getRestaurantOwnerProfile,
  restaurentOwnerLogin,
  restaurentOwnerSignup,
  restaurantOwnerLogout,
  updateRestaurantOwnerProfile,
};
