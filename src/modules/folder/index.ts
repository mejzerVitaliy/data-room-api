import { FastifyInstance } from "fastify";
import { createFolderRoutes } from "./folder.route.js";

// Define the endpoint prefix by providing autoPrefix module property.
export const autoPrefix = "/api/folders";

export default async function (fastify: FastifyInstance) {
    const folderHandler = fastify.di.resolve("folderHandler");
    createFolderRoutes(fastify, folderHandler);
}
