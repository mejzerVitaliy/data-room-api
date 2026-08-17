import { FastifyInstance } from "fastify";
import { createFileRoutes } from "./file.route.js";

// Define the endpoint prefix by providing autoPrefix module property.
export const autoPrefix = "/api/files";

export default async function (fastify: FastifyInstance) {
    const fileHandler = fastify.di.resolve("fileHandler");
    createFileRoutes(fastify, fileHandler);
}
