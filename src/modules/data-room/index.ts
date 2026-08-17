import { FastifyInstance } from "fastify";
import { createDataRoomRoutes } from "./data-room.route.js";

// Define the endpoint prefix by providing autoPrefix module property.
export const autoPrefix = "/api/data-rooms";

export default async function (fastify: FastifyInstance) {
    const dataRoomHandler = fastify.di.resolve("dataRoomHandler");
    createDataRoomRoutes(fastify, dataRoomHandler);
}
