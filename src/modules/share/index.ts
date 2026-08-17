import { FastifyInstance } from "fastify";
import { createShareRoutes } from "./share.route.js";

// Define the endpoint prefix by providing autoPrefix module property.
export const autoPrefix = "/api/shares";

export default async function (fastify: FastifyInstance) {
    const shareHandler = fastify.di.resolve("shareHandler");
    createShareRoutes(fastify, shareHandler);
}
