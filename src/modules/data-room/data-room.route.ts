import { FastifyInstance } from "fastify";
import { DataRoomHandler } from "./data-room.handler.js";
import { paginationQuerySchema } from "@/lib/validation/pagination/pagination.schema.js";
import {
    messageResponseSchema,
    deletePreviewResponseSchema,
} from "@/lib/validation/common/common.schema.js";
import {
    dataRoomParamsSchema,
    createDataRoomBodySchema,
    updateDataRoomBodySchema,
    dataRoomResponseSchema,
    dataRoomsListResponseSchema,
} from "@/lib/validation/data-room/data-room.schema.js";

const DATA_ROOM_TAG = "data-room";

enum DataRoomRoute {
    Root = "/",
    ById = "/:id",
    DeletePreview = "/:id/delete-preview",
}

export const createDataRoomRoutes = (
    fastify: FastifyInstance,
    dataRoomHandler: DataRoomHandler
) => {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.post(
        DataRoomRoute.Root,
        {
            schema: {
                tags: [DATA_ROOM_TAG],
                summary: "Create a Data Room",
                body: createDataRoomBodySchema,
                response: { 200: dataRoomResponseSchema },
            },
        },
        dataRoomHandler.create
    );

    fastify.get(
        DataRoomRoute.Root,
        {
            schema: {
                tags: [DATA_ROOM_TAG],
                summary: "List my Data Rooms",
                querystring: paginationQuerySchema,
                response: { 200: dataRoomsListResponseSchema },
            },
        },
        dataRoomHandler.list
    );

    fastify.get(
        DataRoomRoute.ById,
        {
            schema: {
                tags: [DATA_ROOM_TAG],
                summary: "Get a Data Room",
                params: dataRoomParamsSchema,
                response: { 200: dataRoomResponseSchema },
            },
        },
        dataRoomHandler.getOne
    );

    fastify.patch(
        DataRoomRoute.ById,
        {
            schema: {
                tags: [DATA_ROOM_TAG],
                summary: "Rename a Data Room",
                params: dataRoomParamsSchema,
                body: updateDataRoomBodySchema,
                response: { 200: dataRoomResponseSchema },
            },
        },
        dataRoomHandler.update
    );

    fastify.delete(
        DataRoomRoute.ById,
        {
            schema: {
                tags: [DATA_ROOM_TAG],
                summary: "Delete a Data Room and everything in it",
                params: dataRoomParamsSchema,
                response: { 200: messageResponseSchema },
            },
        },
        dataRoomHandler.remove
    );

    fastify.get(
        DataRoomRoute.DeletePreview,
        {
            schema: {
                tags: [DATA_ROOM_TAG],
                summary: "Preview what deleting a Data Room will remove",
                params: dataRoomParamsSchema,
                response: { 200: deletePreviewResponseSchema },
            },
        },
        dataRoomHandler.getDeletePreview
    );
};
