import logger from "../../utils/logger.js";
import Expense from "../../models/expenses.js";
import Restaurant from "../../models/restaurant.js";
import RestaurantOwner from "../../models/restaurantOwner.js";
import { getLoggedInOwnerId } from "../../utils/restaurantOwnerSession.js";

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
    recipies: restaurant.recipies,
    staffMembers: (restaurant.staffMembers ?? []).map(serializeStaffMember),
  };
}

async function registerRestaurants(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId =
      reqBody.ownerId?.trim?.() ??
      reqBody.ownerId ??
      (await getLoggedInOwnerId());
    const name = reqBody.name?.trim();

    if (!ownerId || !name) {
      logger.warn(
        "Restaurant registration failed: missing ownerId or restaurant name",
      );

      return reply.code(400).send({
        status: "error",
        message: "restaurant name and a logged-in owner are required",
      });
    }

    const owner =
      await RestaurantOwner.findById(ownerId).populate("restaurant");

    if (!owner) {
      logger.warn(`Restaurant registration failed: owner not found ${ownerId}`);

      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    if (owner.restaurant) {
      logger.warn(
        `Restaurant registration failed: owner already has restaurant ${ownerId}`,
      );

      return reply.code(409).send({
        status: "error",
        message: "Restaurant already registered for this owner",
      });
    }

    const restaurant = await Restaurant.create({
      name,
      owner: owner._id,
      recipies: [],
      inventory: [],
    });

    owner.restaurant = restaurant._id;
    await owner.save();

    logger.info(`Restaurant registered successfully for owner: ${owner.email}`);

    return reply.code(201).send({
      status: "success",
      message: "Restaurant registered successfully",
      data: {
        restaurant: serializeRestaurant(restaurant),
      },
    });
  } catch (error) {
    logger.error(`Error from registerRestaurants function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to register restaurant",
    });
  }
}

async function addItems(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId =
      reqBody.ownerId?.trim?.() ??
      reqBody.ownerId ??
      (await getLoggedInOwnerId());
    const inputRecipes = Array.isArray(reqBody.recipes)
      ? reqBody.recipes
      : [
          {
            title: reqBody.title,
            ingredients: reqBody.ingredients,
            price: reqBody.price,
          },
        ];
    const recipes = inputRecipes
      .map((recipe) => {
        const title = recipe?.title?.trim?.();
        const ingredients = Array.isArray(recipe?.ingredients)
          ? recipe.ingredients
              .map((ingredient) =>
                typeof ingredient === "string" ? ingredient.trim() : "",
              )
              .filter(Boolean)
          : [];
        const price = Number(recipe?.price);

        if (!title || Number.isNaN(price)) {
          return null;
        }

        return {
          title,
          ingredients,
          price,
        };
      })
      .filter(Boolean);

    if (!ownerId || recipes.length === 0) {
      logger.warn("Add item failed: missing logged-in owner or valid recipes");

      return reply.code(400).send({
        status: "error",
        message: "at least one valid recipe and a logged-in owner are required",
      });
    }

    const owner = await RestaurantOwner.findById(ownerId);

    if (!owner) {
      logger.warn(`Add item failed: owner not found ${ownerId}`);

      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    if (!owner.restaurant) {
      logger.warn(
        `Add item failed: no restaurant registered for owner ${ownerId}`,
      );

      return reply.code(404).send({
        status: "error",
        message: "Restaurant not registered for this owner",
      });
    }

    const restaurant = await Restaurant.findById(owner.restaurant);

    if (!restaurant) {
      logger.warn(`Add item failed: restaurant not found for owner ${ownerId}`);

      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      {
        $push: {
          recipies: {
            $each: recipes,
          },
        },
      },
      {
        new: true,
      },
    );
    const createdItems =
      updatedRestaurant?.recipies.slice(-recipes.length) ?? [];

    logger.info(`Item added successfully to restaurant: ${restaurant._id}`);

    return reply.code(201).send({
      status: "success",
      message: "Recipes added successfully",
      data: {
        items: createdItems.map((item) => ({
          id: item._id,
          title: item.title,
          ingredients: item.ingredients,
          price: item.price,
        })),
        restaurantId: restaurant._id,
        totalItems: updatedRestaurant?.recipies.length ?? 0,
      },
    });
  } catch (error) {
    logger.error(`Error from addItems function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to add item to restaurant",
    });
  }
}

async function updateRestaurant(request, reply) {
  try {
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());
    const name = request.body?.name?.trim();

    if (!ownerId || !name) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId and restaurant name are required",
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

    restaurant.name = name;
    await restaurant.save();

    return reply.send({
      status: "success",
      message: "Restaurant updated successfully",
      data: {
        restaurant: serializeRestaurant(restaurant),
      },
    });
  } catch (error) {
    logger.error(`Error from updateRestaurant: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to update restaurant",
    });
  }
}

async function addStaffMember(request, reply) {
  try {
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());
    const role = request.body?.role?.toString?.().trim();
    const name = request.body?.name?.trim?.();
    const email = request.body?.email?.trim?.().toLowerCase();
    const allowedRoles = ["chef", "waiter"];

    if (!ownerId || !allowedRoles.includes(role) || !name || !email) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId, role, name and email are required",
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

    const emailExists = (restaurant.staffMembers ?? []).some(
      (member) => member.email === email,
    );

    if (emailExists) {
      return reply.code(409).send({
        status: "error",
        message: "A staff member already exists with this email",
      });
    }

    restaurant.staffMembers.push({
      role,
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
    logger.error(`Error from addStaffMember: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to add staff member",
    });
  }
}

async function deleteStaffMember(request, reply) {
  try {
    const memberId = request.params.memberId?.toString?.().trim();
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());

    if (!ownerId || !memberId) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId and memberId are required",
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

    const member = restaurant.staffMembers.id(memberId);

    if (!member) {
      return reply.code(404).send({
        status: "error",
        message: "Staff member not found",
      });
    }

    member.deleteOne();
    await restaurant.save();

    return reply.send({
      status: "success",
      message: "Staff member removed successfully",
      data: {
        restaurant: serializeRestaurant(restaurant),
      },
    });
  } catch (error) {
    logger.error(`Error from deleteStaffMember: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to remove staff member",
    });
  }
}

async function updateMenuItem(request, reply) {
  try {
    const itemId = request.params.itemId?.toString?.().trim();
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());
    const title = request.body?.title?.trim?.();
    const ingredients = Array.isArray(request.body?.ingredients)
      ? request.body.ingredients
          .map((ingredient) =>
            typeof ingredient === "string" ? ingredient.trim() : "",
          )
          .filter(Boolean)
      : [];
    const price = Number(request.body?.price);

    if (!itemId || !ownerId || !title || Number.isNaN(price)) {
      return reply.code(400).send({
        status: "error",
        message: "itemId, ownerId, title and valid price are required",
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

    const recipe = restaurant.recipies.id(itemId);

    if (!recipe) {
      return reply.code(404).send({
        status: "error",
        message: "Menu item not found",
      });
    }

    recipe.title = title;
    recipe.ingredients = ingredients;
    recipe.price = price;
    await restaurant.save();

    return reply.send({
      status: "success",
      message: "Menu item updated successfully",
      data: {
        item: {
          id: recipe._id,
          title: recipe.title,
          ingredients: recipe.ingredients,
          price: recipe.price,
        },
        restaurantId: restaurant._id,
      },
    });
  } catch (error) {
    logger.error(`Error from updateMenuItem: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to update menu item",
    });
  }
}

async function deleteMenuItem(request, reply) {
  try {
    const itemId = request.params.itemId?.toString?.().trim();
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());

    if (!itemId || !ownerId) {
      return reply.code(400).send({
        status: "error",
        message: "itemId and ownerId are required",
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

    const recipe = restaurant.recipies.id(itemId);

    if (!recipe) {
      return reply.code(404).send({
        status: "error",
        message: "Menu item not found",
      });
    }

    recipe.deleteOne();
    await restaurant.save();

    return reply.send({
      status: "success",
      message: "Menu item deleted successfully",
      data: {
        restaurantId: restaurant._id,
        totalItems: restaurant.recipies.length,
      },
    });
  } catch (error) {
    logger.error(`Error from deleteMenuItem: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to delete menu item",
    });
  }
}

async function addInventory(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId =
      reqBody.ownerId?.trim?.() ??
      reqBody.ownerId ??
      (await getLoggedInOwnerId());
    const inputStocks = Array.isArray(reqBody.items)
      ? reqBody.items
      : [
          {
            name: reqBody.name,
            quantity: reqBody.quantity,
            unit: reqBody.unit,
            price: reqBody.price,
            available: reqBody.available,
          },
        ];

    const inventoryItems = inputStocks
      .map((item) => {
        const name = item?.name?.trim?.();
        const quantity = Number(item?.quantity);
        const unit = item?.unit?.trim?.() || "kg";
        const price = Number(item?.price);
        const available =
          typeof item?.available === "boolean" ? item.available : true;

        if (
          !name ||
          Number.isNaN(quantity) ||
          quantity < 0 ||
          Number.isNaN(price) ||
          price < 0
        ) {
          return null;
        }

        return {
          name,
          quantity,
          unit,
          price,
          available,
        };
      })
      .filter(Boolean);

    if (!ownerId || inventoryItems.length === 0) {
      logger.warn(
        "Add inventory failed: missing logged-in owner or valid stock items",
      );

      return reply.code(400).send({
        status: "error",
        message:
          "at least one valid inventory item and a logged-in owner are required",
      });
    }

    const owner = await RestaurantOwner.findById(ownerId);

    if (!owner) {
      logger.warn(`Add inventory failed: owner not found ${ownerId}`);

      return reply.code(404).send({
        status: "error",
        message: "Restaurant owner not found",
      });
    }

    if (!owner.restaurant) {
      logger.warn(
        `Add inventory failed: no restaurant registered for owner ${ownerId}`,
      );

      return reply.code(404).send({
        status: "error",
        message: "Restaurant not registered for this owner",
      });
    }

    const restaurant = await Restaurant.findById(owner.restaurant);

    if (!restaurant) {
      logger.warn(
        `Add inventory failed: restaurant not found for owner ${ownerId}`,
      );

      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      {
        $push: {
          inventory: {
            $each: inventoryItems,
          },
        },
      },
      {
        new: true,
      },
    );
    const createdInventory =
      updatedRestaurant?.inventory.slice(-inventoryItems.length) ?? [];

    logger.info(`Inventory added successfully to restaurant: ${restaurant._id}`);

    return reply.code(201).send({
      status: "success",
      message: "Inventory added successfully",
      data: {
        items: createdInventory.map((item) => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || "kg",
          price: item.price,
          available: item.available !== false,
        })),
        restaurantId: restaurant._id,
        totalItems: updatedRestaurant?.inventory.length ?? 0,
      },
    });
  } catch (error) {
    logger.error(`Error from addInventory function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to add inventory",
    });
  }
}

async function getInventory(request, reply) {
  try {
    const restaurantId = request.query.restaurant_id?.toString?.().trim();

    if (!restaurantId) {
      return reply.code(400).send({
        status: "error",
        message: "restaurant_id query parameter is required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    return reply.send({
      status: "success",
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
        totalItems: restaurant.inventory?.length ?? 0,
        inventory: (restaurant.inventory ?? []).map((item) => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || "kg",
          price: item.price,
          available: item.available !== false,
        })),
      },
    });
  } catch (error) {
    logger.error(`Error from getInventory function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch inventory",
    });
  }
}

async function addExpense(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId =
      reqBody.ownerId?.trim?.() ??
      reqBody.ownerId ??
      (await getLoggedInOwnerId());
    const title = reqBody.title?.trim?.() || reqBody.name?.trim?.();
    const amount = Number(reqBody.amount);
    const note = reqBody.note?.toString?.().trim() ?? "";
    const tags = Array.isArray(reqBody.tags)
      ? reqBody.tags
          .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
          .filter(Boolean)
      : (reqBody.tags ?? "")
          .toString()
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean);
    const fallbackTag = reqBody.tag?.toString?.().trim() ?? "";
    const normalizedTags =
      tags.length > 0 ? tags : fallbackTag ? [fallbackTag] : [];

    if (!ownerId || !title || !Number.isFinite(amount) || amount < 0) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId, title and a valid amount are required",
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

    const expense = await Expense.create({
      restaurant_id: restaurant._id,
      title,
      amount,
      tag: normalizedTags[0] ?? "",
      tags: normalizedTags,
      note,
    });

    return reply.code(201).send({
      status: "success",
      message: "Expense added successfully",
      data: {
        expense: {
          id: expense._id,
          restaurant_id: expense.restaurant_id,
          title: expense.title,
          amount: expense.amount,
          tag: expense.tag ?? expense.tags?.[0] ?? "",
          tags: expense.tags ?? (expense.tag ? [expense.tag] : []),
          note: expense.note ?? "",
          time: expense.time,
        },
        restaurantId: restaurant._id,
      },
    });
  } catch (error) {
    logger.error(`Error from addExpense: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to add expense",
    });
  }
}

async function getExpenses(request, reply) {
  try {
    const restaurantId =
      request.query.restaurant_id?.toString?.().trim() ??
      request.query.restaurantId?.toString?.().trim();

    if (!restaurantId) {
      return reply.code(400).send({
        status: "error",
        message: "restaurant_id query parameter is required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    const [storedExpenses, legacyExpenses] = await Promise.all([
      Expense.find({ restaurant_id: restaurantId }).sort({ time: -1 }).lean(),
      Promise.resolve(restaurant.expenses ?? []),
    ]);

    const expenses = [
      ...storedExpenses.map((expense) => ({
        id: expense._id,
        restaurant_id: expense.restaurant_id,
        title: expense.title,
        amount: expense.amount,
        tag: expense.tag ?? expense.tags?.[0] ?? "",
        tags: expense.tags ?? (expense.tag ? [expense.tag] : []),
        note: expense.note ?? "",
        time: expense.time,
      })),
      ...legacyExpenses.map((expense) => ({
        id: expense._id,
        restaurant_id: restaurant._id,
        title: expense.title,
        amount: expense.amount,
        tag: expense.tags?.[0] ?? "",
        tags: expense.tags ?? [],
        note: expense.note ?? "",
        time: expense.createdAt,
      })),
    ].sort((left, right) => new Date(right.time) - new Date(left.time));

    return reply.send({
      status: "success",
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
        },
        totalExpenses: expenses.length,
        expenses,
      },
    });
  } catch (error) {
    logger.error(`Error from getExpenses: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch expenses",
    });
  }
}

async function deleteExpense(request, reply) {
  try {
    const expenseId = request.params.expenseId?.toString?.().trim();
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());

    if (!expenseId || !ownerId) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId and expenseId are required",
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

    const deletedExpense = await Expense.findOneAndDelete({
      _id: expenseId,
      restaurant_id: restaurant._id,
    });

    if (deletedExpense) {
      const totalExpenses = await Expense.countDocuments({
        restaurant_id: restaurant._id,
      });

      return reply.send({
        status: "success",
        message: "Expense deleted successfully",
        data: {
          restaurantId: restaurant._id,
          totalExpenses,
        },
      });
    }

    const legacyExpense = restaurant.expenses.id(expenseId);

    if (!legacyExpense) {
      return reply.code(404).send({
        status: "error",
        message: "Expense not found",
      });
    }

    legacyExpense.deleteOne();
    await restaurant.save();

    return reply.send({
      status: "success",
      message: "Expense deleted successfully",
      data: {
        restaurantId: restaurant._id,
        totalExpenses: restaurant.expenses.length,
      },
    });
  } catch (error) {
    logger.error(`Error from deleteExpense: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to delete expense",
    });
  }
}

async function updateInventoryItem(request, reply) {
  try {
    const inventoryId = request.params.inventoryId?.toString?.().trim();
    const reqBody = request.body ?? {};
    const ownerId =
      reqBody.ownerId?.trim?.() ??
      reqBody.ownerId ??
      (await getLoggedInOwnerId());
    const name = reqBody.name?.trim?.();
    const quantity = Number(reqBody.quantity);
    const unit = reqBody.unit?.trim?.() || "kg";
    const price = Number(reqBody.price);
    const available =
      typeof reqBody.available === "boolean" ? reqBody.available : true;

    if (
      !inventoryId ||
      !ownerId ||
      !name ||
      Number.isNaN(quantity) ||
      quantity < 0 ||
      Number.isNaN(price) ||
      price < 0
    ) {
      return reply.code(400).send({
        status: "error",
        message:
          "ownerId, inventoryId, name, valid quantity and valid price are required",
      });
    }

    const owner = await RestaurantOwner.findById(ownerId);

    if (!owner?.restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not registered for this owner",
      });
    }

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        _id: owner.restaurant,
        "inventory._id": inventoryId,
      },
      {
        $set: {
          "inventory.$.name": name,
          "inventory.$.quantity": quantity,
          "inventory.$.unit": unit,
          "inventory.$.price": price,
          "inventory.$.available": available,
        },
      },
      {
        new: true,
      },
    );

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Inventory item not found",
      });
    }

    const updatedItem = restaurant.inventory.id(inventoryId);

    return reply.send({
      status: "success",
      message: "Inventory updated successfully",
      data: {
        item: {
          id: updatedItem._id,
          name: updatedItem.name,
          quantity: updatedItem.quantity,
          unit: updatedItem.unit || "kg",
          price: updatedItem.price,
          available: updatedItem.available !== false,
        },
        restaurantId: restaurant._id,
      },
    });
  } catch (error) {
    logger.error(`Error from updateInventoryItem function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to update inventory",
    });
  }
}

async function deleteInventoryItem(request, reply) {
  try {
    const inventoryId = request.params.inventoryId?.toString?.().trim();
    const reqBody = request.body ?? {};
    const ownerId =
      reqBody.ownerId?.trim?.() ??
      reqBody.ownerId ??
      (await getLoggedInOwnerId());

    if (!inventoryId || !ownerId) {
      return reply.code(400).send({
        status: "error",
        message: "ownerId and inventoryId are required",
      });
    }

    const owner = await RestaurantOwner.findById(ownerId);

    if (!owner?.restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not registered for this owner",
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      owner.restaurant,
      {
        $pull: {
          inventory: {
            _id: inventoryId,
          },
        },
      },
      {
        new: true,
      },
    );

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    return reply.send({
      status: "success",
      message: "Inventory deleted successfully",
      data: {
        restaurantId: restaurant._id,
        totalItems: restaurant.inventory.length,
      },
    });
  } catch (error) {
    logger.error(`Error from deleteInventoryItem function: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to delete inventory",
    });
  }
}

async function addInventoryMovement(request, reply) {
  try {
    const inventoryId = request.params.inventoryId?.toString?.().trim();
    const ownerId =
      request.body?.ownerId?.trim?.() ??
      request.body?.ownerId ??
      (await getLoggedInOwnerId());
    const type = request.body?.type?.toString?.().trim();
    const quantity = Number(request.body?.quantity);
    const note = request.body?.note?.toString?.().trim() ?? "";

    if (!inventoryId || !ownerId || !type || !Number.isFinite(quantity) || quantity <= 0) {
      return reply.code(400).send({
        status: "error",
        message: "inventoryId, ownerId, type and positive quantity are required",
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

    const inventoryItem = restaurant.inventory.id(inventoryId);

    if (!inventoryItem) {
      return reply.code(404).send({
        status: "error",
        message: "Inventory item not found",
      });
    }

    const direction = type === "restock" ? 1 : -1;
    const resultingQuantity = inventoryItem.quantity + direction * quantity;

    if (resultingQuantity < 0) {
      return reply.code(400).send({
        status: "error",
        message: "Movement would reduce stock below zero",
      });
    }

    inventoryItem.quantity = resultingQuantity;
    inventoryItem.available = resultingQuantity > 0;
    restaurant.inventoryMovements.push({
      inventory_id: inventoryItem._id,
      inventoryName: inventoryItem.name,
      type,
      quantityChange: direction * quantity,
      resultingQuantity,
      unit: inventoryItem.unit || "kg",
      price: inventoryItem.price,
      note,
    });
    await restaurant.save();

    return reply.send({
      status: "success",
      message: "Inventory movement recorded successfully",
      data: {
        item: {
          id: inventoryItem._id,
          quantity: inventoryItem.quantity,
          available: inventoryItem.available,
        },
        restaurantId: restaurant._id,
      },
    });
  } catch (error) {
    logger.error(`Error from addInventoryMovement: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to record inventory movement",
    });
  }
}

async function getRestaurantAnalytics(request, reply) {
  try {
    const restaurantId =
      request.query.restaurant_id?.toString?.().trim() ??
      request.query.restaurantId?.toString?.().trim();

    if (!restaurantId) {
      return reply.code(400).send({
        status: "error",
        message: "restaurant_id query parameter is required",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId).lean();

    if (!restaurant) {
      return reply.code(404).send({
        status: "error",
        message: "Restaurant not found",
      });
    }

    const Order = (await import("../../models/orders.js")).default;
    const paidOrders = await Order.find({
      restaurant_id: restaurantId,
      paymentStatus: "paid",
    }).lean();

    const totalRevenue = paidOrders.reduce(
      (sum, order) => sum + (order.totalPrice ?? 0),
      0,
    );
    const totalPaidOrders = paidOrders.length;
    const inventoryCost = (restaurant.inventory ?? []).reduce(
      (sum, item) => sum + (item.quantity ?? 0) * (item.price ?? 0),
      0,
    );
    const [storedExpenses, legacyExpenses] = await Promise.all([
      Expense.find({ restaurant_id: restaurantId }).lean(),
      Promise.resolve(restaurant.expenses ?? []),
    ]);
    const normalizedExpenses = [
      ...storedExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        amount: expense.amount ?? 0,
        tag: expense.tag ?? expense.tags?.[0] ?? "",
        tags: expense.tags ?? (expense.tag ? [expense.tag] : []),
        note: expense.note ?? "",
        time: expense.time,
      })),
      ...legacyExpenses.map((expense) => ({
        id: expense._id,
        title: expense.title,
        amount: expense.amount ?? 0,
        tag: expense.tags?.[0] ?? "",
        tags: expense.tags ?? [],
        note: expense.note ?? "",
        time: expense.createdAt,
      })),
    ];
    const totalExpenses = normalizedExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const averageMenuPrice =
      restaurant.recipies?.length > 0
        ? restaurant.recipies.reduce((sum, item) => sum + (item.price ?? 0), 0) /
          restaurant.recipies.length
        : 0;
    const unavailableItems = (restaurant.inventory ?? []).filter(
      (item) => item.available === false || item.quantity <= 0,
    );
    const lowStockItems = (restaurant.inventory ?? []).filter(
      (item) => item.quantity > 0 && item.quantity <= 5,
    );

    return reply.send({
      status: "success",
      data: {
        summary: {
          totalRevenue,
          totalPaidOrders,
          inventoryCost,
          totalExpenses,
          averageMenuPrice,
          estimatedGrossMargin: totalRevenue - inventoryCost,
          estimatedNetAfterExpenses: totalRevenue - inventoryCost - totalExpenses,
        },
        unavailableItems: unavailableItems.map((item) => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || "kg",
        })),
        lowStockItems: lowStockItems.map((item) => ({
          id: item._id,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || "kg",
        })),
        recentMovements: (restaurant.inventoryMovements ?? [])
          .sort((left, right) => right.createdAt - left.createdAt)
          .slice(0, 10)
          .map((movement) => ({
            id: movement._id,
            inventoryName: movement.inventoryName,
            type: movement.type,
            quantityChange: movement.quantityChange,
            resultingQuantity: movement.resultingQuantity,
            unit: movement.unit,
            note: movement.note,
            createdAt: movement.createdAt,
          })),
        recentExpenses: normalizedExpenses
          .slice()
          .sort((left, right) => new Date(right.time) - new Date(left.time))
          .slice(0, 10)
          .map((expense) => ({
            id: expense.id,
            title: expense.title,
            amount: expense.amount,
            tags: expense.tags ?? [],
            note: expense.note ?? "",
            time: expense.time,
          })),
        expenseBreakdown: Object.entries(
          normalizedExpenses.reduce((groups, expense) => {
            const normalizedTags =
              Array.isArray(expense.tags) && expense.tags.length > 0
                ? expense.tags
                : ["untagged"];

            normalizedTags.forEach((tag) => {
              groups[tag] = (groups[tag] ?? 0) + (expense.amount ?? 0);
            });

            return groups;
          }, {}),
        )
          .map(([tag, amount]) => ({
            tag,
            amount,
          }))
          .sort((left, right) => right.amount - left.amount),
      },
    });
  } catch (error) {
    logger.error(`Error from getRestaurantAnalytics: ${error.message}`);

    return reply.code(500).send({
      status: "error",
      message: "Unable to fetch analytics",
    });
  }
}

export {
  addStaffMember,
  addExpense,
  addInventory,
  addInventoryMovement,
  addItems,
  deleteStaffMember,
  deleteExpense,
  deleteMenuItem,
  deleteInventoryItem,
  getExpenses,
  getInventory,
  getRestaurantAnalytics,
  registerRestaurants,
  updateMenuItem,
  updateRestaurant,
  updateInventoryItem,
};
