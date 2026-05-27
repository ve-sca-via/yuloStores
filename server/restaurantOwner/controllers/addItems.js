import logger from '../../utils/logger.js';
import Restaurant from '../../models/restaurant.js';
import RestaurantOwner from '../../models/restaurantOwner.js';

async function registerRestaurants(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const ownerId = reqBody.ownerId?.trim?.() ?? reqBody.ownerId;
    const name = reqBody.name?.trim();

    if (!ownerId || !name) {
      logger.warn('Restaurant registration failed: missing ownerId or restaurant name');

      return reply.code(400).send({
        status: 'error',
        message: 'ownerId and restaurant name are required',
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
    const ownerId = reqBody.ownerId?.trim?.() ?? reqBody.ownerId;
    const title = reqBody.title?.trim();
    const ingredients = Array.isArray(reqBody.ingredients)
      ? reqBody.ingredients
          .map((ingredient) => (typeof ingredient === 'string' ? ingredient.trim() : ''))
          .filter(Boolean)
      : [];
    const price = Number(reqBody.price);

    if (!ownerId || !title || Number.isNaN(price)) {
      logger.warn('Add item failed: missing ownerId, title or valid price');

      return reply.code(400).send({
        status: 'error',
        message: 'ownerId, title and valid price are required',
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

    const item = {
      title,
      ingredients,
      price,
    };

    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      restaurant._id,
      {
        $push: {
          recipies: item,
        },
      },
      {
        new: true,
      },
    );

    const createdItem = updatedRestaurant?.recipies[updatedRestaurant.recipies.length - 1];

    logger.info(`Item added successfully to restaurant: ${restaurant._id}`);

    return reply.code(201).send({
      status: 'success',
      message: 'Item added successfully',
      data: {
        item: {
          id: createdItem._id,
          title: createdItem.title,
          ingredients: createdItem.ingredients,
          price: createdItem.price,
        },
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
