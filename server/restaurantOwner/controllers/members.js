import logger from "../../utils/logger.js";
import Restaurant from "../../models/restaurant.js";
import RestaurantOwner from "../../models/restaurantOwner.js";
import { getLoggedInOwnerId } from "../../utils/restaurantOwnerSession.js";

function serializeStaffMember(member) {
  return {
    id: member._id,
    role: member.role,
    name: member.name,
    email: member.email,
    employeeId: member.employeeId,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

function serializeRestaurant(restaurant) {
  return {
    id: restaurant._id,
    name: restaurant.name,
    owner: restaurant.owner,
    recipies: restaurant.recipies ?? [],
    staffMembers: (restaurant.staffMembers ?? []).map(serializeStaffMember),
  };
}

async function getOwnerAndRestaurant(ownerId) {
  const owner = await RestaurantOwner.findById(ownerId);

  if (!owner?.restaurant) {
    return {
      owner,
      restaurant: null,
    };
  }

  const restaurant = await Restaurant.findById(owner.restaurant);

  return {
    owner,
    restaurant,
  };
}

async function addEmployeeMember(request, reply) {
  try {
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());
    const role = request.body?.role?.toString?.().trim();
    const employeeId = request.body?.employeeId?.trim?.().toLowerCase();
    const password = request.body?.password?.toString?.();
    const name = request.body?.name?.trim?.() ?? "";
    const email = request.body?.email?.trim?.()?.toLowerCase?.() ?? "";
    const allowedRoles = ["chef", "waiter"];

    if (!ownerId || !allowedRoles.includes(role) || !employeeId || !password) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId, role, employeeId and password are required",
      });
    }

    const { owner, restaurant } = await getOwnerAndRestaurant(ownerId);

    if (!owner) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not registered for this owner",
      });
    }

    const employeeIdExists = await Restaurant.findOne({
      "staffMembers.employeeId": employeeId,
    });

    if (employeeIdExists) {
      return reply.code(409).send({
        status: "error",
        message: "A staff member already exists with this employeeId",
      });
    }

    restaurant.staffMembers.push({
      role,
      employeeId,
      password,
      name,
      email,
    });
    await restaurant.save();

    const createdMember =
      restaurant.staffMembers[restaurant.staffMembers.length - 1];

    return reply.code(201).send({
      status: "success",
      message: `${role} member added successfully`,
      data: {
        member: serializeStaffMember(createdMember),
        restaurant: serializeRestaurant(restaurant),
      },
    });
  } catch (error) {
    logger.error(`Error from addEmployeeMember: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to add employee member",
    });
  }
}

async function loginEmployeeMember(request, reply) {
  try {
    const employeeId = request.body?.employeeId?.trim?.().toLowerCase();
    const password = request.body?.password?.toString?.();

    if (!employeeId || !password) {
      return reply.code(400).send({
        status: "error",
        message: "employeeId and password are required",
      });
    }

    const restaurant = await Restaurant.findOne({
      "staffMembers.employeeId": employeeId,
    });

    if (!restaurant) {
      return reply.code(401).send({
        status: "error",
        message: "Invalid employeeId or password",
      });
    }

    const member = restaurant.staffMembers.find(
      (staffMember) => staffMember.employeeId === employeeId,
    );

    if (!member || member.password !== password) {
      return reply.code(401).send({
        status: "error",
        message: "Invalid employeeId or password",
      });
    }

    return reply.send({
      status: "success",
      message: "Employee login successful",
      data: {
        member: serializeStaffMember(member),
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
        portal: member.role === "chef" ? "/chef" : "/waiter",
      },
    });
  } catch (error) {
    logger.error(`Error from loginEmployeeMember: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to login employee member",
    });
  }
}

export { addEmployeeMember, loginEmployeeMember };
