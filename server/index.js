import "dotenv/config";
import buildApp from "./buildApp.js";
import logger from "./utils/logger.js";
import { mongoConnect } from "./config/mongoConnector.js";

const start = async () => {
  try {
    await mongoConnect();

    const app = await buildApp();
    const port = Number(process.env.PORT) || 3000;

    await app.listen({ port, host: "0.0.0.0" });
    logger.info(`Server started on http://0.0.0.0:${port}`);
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
};

start();
