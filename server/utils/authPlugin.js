import fastifyJwt from "@fastify/jwt";

/**
 * Registers JWT support and exposes auth preHandlers on the app instance:
 *
 *   app.authenticate    -> verifies the Bearer token, sets request.user
 *   app.requireOwner    -> authenticate + ensure the caller is a restaurant owner
 *   app.requireEmployee -> authenticate + ensure the caller is a staff member
 *
 * Token payloads:
 *   owner    -> { sub: <ownerId>, type: "owner" }
 *   employee -> { sub: <memberId>, type: "employee", role, restaurantId }
 *
 * After requireOwner, controllers read request.ownerId (never request.body.ownerId).
 */
async function registerAuth(app) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "JWT_SECRET is not set. Add it to your .env before starting the server.",
    );
  }

  await app.register(fastifyJwt, {
    secret,
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  });

  // Verifies the token and populates request.user. Used as a route preHandler.
  app.decorate("authenticate", async function authenticate(request, reply) {
    try {
      await request.jwtVerify();
    } catch (_error) {
      return reply.code(401).send({
        status: "error",
        message: "Authentication required",
      });
    }
  });

  app.decorate("requireOwner", async function requireOwner(request, reply) {
    try {
      await request.jwtVerify();
    } catch (_error) {
      return reply.code(401).send({
        status: "error",
        message: "Authentication required",
      });
    }

    if (request.user?.type !== "owner") {
      return reply.code(403).send({
        status: "error",
        message: "Owner access required",
      });
    }

    // Single source of truth for the owner identity: the verified token.
    request.ownerId = request.user.sub;
  });

  // Factory for employee guards, optionally restricted to a single role.
  function makeEmployeeGuard(requiredRole) {
    return async function requireEmployeeRole(request, reply) {
      try {
        await request.jwtVerify();
      } catch (_error) {
        return reply.code(401).send({
          status: "error",
          message: "Authentication required",
        });
      }

      if (request.user?.type !== "employee") {
        return reply.code(403).send({
          status: "error",
          message: "Employee access required",
        });
      }

      if (requiredRole && request.user.role !== requiredRole) {
        return reply.code(403).send({
          status: "error",
          message: `${requiredRole} access required`,
        });
      }

      request.employee = request.user;
    };
  }

  app.decorate("requireEmployee", makeEmployeeGuard());
  app.decorate("requireChef", makeEmployeeGuard("chef"));
  app.decorate("requireWaiter", makeEmployeeGuard("waiter"));
}

export default registerAuth;
