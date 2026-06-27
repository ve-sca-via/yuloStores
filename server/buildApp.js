import "dotenv/config";
import fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import chefRoutes from "./chefPortal/chefRoutes.js";
import restaurantOwnerRoutes from "./restaurantOwner/restaurantRoutes.js";
import waiterRoutes from "./waiterPortal/waiterRoutes.js";
import registerAuth from "./utils/authPlugin.js";

const ONE_MEGABYTE = 1024 * 1024;

/**
 * Builds and configures the Fastify app without connecting to MongoDB or
 * listening on a port, so it can be reused by both the server entrypoint
 * (index.js) and the test suite (via app.inject).
 *
 * options:
 *   logger    - Fastify logger config (default: true)
 *   rateLimit - enable rate limiting (default: true; tests pass false)
 */
async function buildApp(options = {}) {
  const { logger = true, rateLimit: enableRateLimit = true } = options;

  const app = fastify({
    logger,
    bodyLimit: ONE_MEGABYTE,
    // Several inputs accept a number or its string form (form fields post
    // strings; controllers coerce with Number()). Allow union types in schemas.
    ajv: { customOptions: { allowUnionTypes: true } },
  });

  // --- Security headers ---
  // CSP is disabled because the app serves a built SPA and opens a
  // client-generated bill window with inline styles, and loads QR images from
  // an external host. All other helmet protections (HSTS, no-sniff, frameguard,
  // referrer-policy, etc.) remain active. Tightening CSP is a follow-up.
  await app.register(helmet, { contentSecurityPolicy: false });

  // --- CORS ---
  // Auth uses bearer tokens (no cookies), so credentials are not required.
  // Set CORS_ORIGIN (comma-separated) in production; defaults to reflecting the
  // request origin for local development.
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : true;
  await app.register(cors, { origin: corsOrigin });

  // --- Rate limiting ---
  // Global ceiling per IP; auth routes set a stricter per-route limit.
  if (enableRateLimit) {
    await app.register(rateLimit, {
      max: Number(process.env.RATE_LIMIT_MAX) || 100,
      timeWindow: process.env.RATE_LIMIT_WINDOW || "1 minute",
    });
  }

  // --- Auth (JWT) ---
  await registerAuth(app);

  // Normalize framework errors (schema validation, rate limit, etc.) to the
  // app's { status, message } response shape. 5xx details are not leaked.
  app.setErrorHandler((error, request, reply) => {
    if (error.validation) {
      return reply.code(400).send({ status: "error", message: error.message });
    }

    if (error.statusCode === 429) {
      return reply.code(429).send({
        status: "error",
        message: "Too many requests, please try again later",
      });
    }

    const statusCode = error.statusCode ?? 500;

    if (statusCode >= 500) {
      request.log.error(error);

      return reply
        .code(500)
        .send({ status: "error", message: "Internal server error" });
    }

    return reply.code(statusCode).send({ status: "error", message: error.message });
  });

  app.get("/", async () => ({ message: "Server is running" }));

  // --- Routes ---
  await app.register(restaurantOwnerRoutes);
  await app.register(chefRoutes);
  await app.register(waiterRoutes);

  return app;
}

export default buildApp;
