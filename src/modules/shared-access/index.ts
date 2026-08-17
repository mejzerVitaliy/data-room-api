import { FastifyInstance } from "fastify";
import { createSharedAccessRoutes } from "./shared-access.route.js";

// Define the endpoint prefix by providing autoPrefix module property.
export const autoPrefix = "/api/shared";

export default async function (fastify: FastifyInstance) {
    const sharedAccessHandler = fastify.di.resolve("sharedAccessHandler");
    createSharedAccessRoutes(fastify, sharedAccessHandler);
}
