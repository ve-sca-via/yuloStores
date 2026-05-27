import logger from '../../utils/logger.js';
import Restaurant from '../../models/restaurant.js';
import RestaurantOwner from '../../models/restaurantOwner.js';
import { getLoggedInOwnerId } from '../../utils/restaurantOwnerSession.js';

async function registerRestaurants(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId = reqBody.ownerId?.trim?.() ?? reqBody.ownerId ?? (await getLoggedInOwnerId());
    const name = reqBody.name?.trim();

    if (!ownerId || !name) {
      logger.warn('Restaurant registration failed: missing ownerId or restaurant name');

      return reply.code(400).send({
        status: 'error',
        message: 'restaurant name and a logged-in owner are required',
      });
    }

    const owner = await RestaurantOwner.findById(ownerId).populate('restaurant');

    if (!owner) {
      logger.warn(`Restaurant registration failed: owner not found ${ownerId}`);

      return reply.code(404).send({
        status: 'error',
        message: 'Restaurant owner not found',
      });
    }

    if (owner.restaurant) {
      logger.warn(`Restaurant registration failed: owner already has restaurant ${ownerId}`);

      return reply.code(409).send({
        status: 'error',
        message: 'Restaurant already registered for this owner',
      });
    }

    const restaurant = await Restaurant.create({
      name,
      owner: owner._id,
      recipies: [],
    });

    owner.restaurant = restaurant._id;
    await owner.save();

    logger.info(`Restaurant registered successfully for owner: ${owner.email}`);

    return reply.code(201).send({
      status: 'success',
      message: 'Restaurant registered successfully',
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
      status: 'error',
      message: 'Unable to register restaurant',
    });
  }
}

async function addItems(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId = reqBody.ownerId?.trim?.() ?? reqBody.ownerId ?? (await getLoggedInOwnerId());
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
              .map((ingredient) => (typeof ingredient === 'string' ? ingredient.trim() : ''))
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
      logger.warn('Add item failed: missing logged-in owner or valid recipes');

      return reply.code(400).send({
        status: 'error',
        message: 'at least one valid recipe and a logged-in owner are required',
      });
    }

    const owner = await RestaurantOwner.findById(ownerId);

    if (!owner) {
      logger.warn(`Add item failed: owner not found ${ownerId}`);

      return reply.code(404).send({
        status: 'error',
        message: 'Restaurant owner not found',
      });
    }

    if (!owner.restaurant) {
      logger.warn(`Add item failed: no restaurant registered for owner ${ownerId}`);

      return reply.code(404).send({
        status: 'error',
        message: 'Restaurant not registered for this owner',
      });
    }

    const restaurant = await Restaurant.findById(owner.restaurant);

    if (!restaurant) {
      logger.warn(`Add item failed: restaurant not found for owner ${ownerId}`);

      return reply.code(404).send({
        status: 'error',
        message: 'Restaurant not found',
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
    const createdItems = updatedRestaurant?.recipies.slice(-recipes.length) ?? [];

    logger.info(`Item added successfully to restaurant: ${restaurant._id}`);

    return reply.code(201).send({
      status: 'success',
      message: 'Recipes added successfully',
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
      status: 'error',
      message: 'Unable to add item to restaurant',
    });
  }
}

export { addItems, registerRestaurants };
