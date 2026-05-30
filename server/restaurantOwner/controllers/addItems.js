import logger from "../../utils/logger.js";
import Restaurant from "../../models/restaurant.js";
import RestaurantOwner from "../../models/restaurantOwner.js";
import { getLoggedInOwnerId } from "../../utils/restaurantOwnerSession.js";

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
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          owner: restaurant.owner,
          recipies: restaurant.recipies,
        },
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

export {
  addInventory,
  addItems,
  deleteInventoryItem,
  getInventory,
  registerRestaurants,
  updateInventoryItem,
};
