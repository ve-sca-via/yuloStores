import logger from "../utils/logger.js";
import mongoose from "mongoose";
async function mongoConnect(){
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info("Connected to MongoDB");
    } catch (error) {
        logger.error(`Error while connecting to mongoDB ${error.message}`);
        process.exit(1);
    }
}

export {mongoConnect};