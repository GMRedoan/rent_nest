import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";
import { redisClient } from "./lib/redis";

const port = config.port;

async function main() {
    try {
        await prisma.$connect();
        console.log("Database connected");
        await redisClient.connect();
        console.log("Redis connected");

        app.listen(port, () => console.log(`Server running on port ${port}`));
    } catch (error) {
        console.log("error", error);
        await prisma.$disconnect();
        process.exit(1);
    }
}

main();