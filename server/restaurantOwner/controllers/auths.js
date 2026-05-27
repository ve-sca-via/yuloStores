import logger from '../../utils/logger.js';
import RestaurantOwner from '../../models/restaurantOwner.js';
import { saveLoggedInOwnerId } from '../../utils/restaurantOwnerSession.js';

async function restaurentOwnerSignup(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const name = reqBody.name?.trim();
    const email = reqBody.email?.trim()?.toLowerCase();
    const password = reqBody.password;

    if (!name || !email || !password) {
      logger.warn('Restaurant owner signup failed: missing required fields');

      return reply.code(400).send({
        status: 'error',
        message: 'Name, email and password are required',
      });
    }

    const existingOwner = await RestaurantOwner.findOne({ email });

    if (existingOwner) {
      logger.warn(`Restaurant owner signup failed: email already exists ${email}`);

      return reply.code(409).send({
        status: 'error',
        message: 'Restaurant owner already exists with this email',
      });
    }

    const owner = await RestaurantOwner.create({
      name,
      email,
      password,
    });

    logger.info(`Restaurant owner signup successful for email: ${email}`);

    return reply.code(201).send({
      status: 'success',
      message: 'Restaurant owner created successfully',
      data: {
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          restaurant: owner.restaurant,
        },
      },
    });
  } catch (error) {
    logger.error(`Error from restaurentOwnerSignup: ${error.message}`);

    return reply.code(500).send({
      status: 'error',
      message: 'Unable to create restaurant owner',
    });
  }
}

async function restaurentOwnerLogin(request, reply) {
  try {
    const reqBody = request.body ?? {};
    const email = reqBody.email?.trim()?.toLowerCase();
    const password = reqBody.password;

    if (!email || !password) {
      logger.warn('Restaurant owner login failed: missing email or password');

      return reply.code(400).send({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const owner = await RestaurantOwner.findOne({ email }).populate('restaurant');

    if (!owner || owner.password !== password) {
      logger.warn(`Restaurant owner login failed for email: ${email}`);

      return reply.code(401).send({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    await saveLoggedInOwnerId(owner._id.toString());

    logger.info(`Restaurant owner login attempt for email: ${email}`);

    return reply.code(200).send({
      status: 'success',
      message: 'Login successful',
      data: {
        owner: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
          restaurant: owner.restaurant,
        },
        session: {
          ownerId: owner._id,
        },
      },
    });
  } catch (error) {
    logger.error(`Error from restaurantOwnerLogin: ${error.message}`);

    return reply.code(500).send({
      status: 'error',
      message: 'Unable to login restaurant owner',
    });
  }
}

export { restaurentOwnerLogin, restaurentOwnerSignup };
