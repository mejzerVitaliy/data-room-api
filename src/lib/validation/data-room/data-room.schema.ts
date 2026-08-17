import { z } from "zod";
import { paginationMetaSchema } from "@/lib/validation/pagination/pagination.schema.js";

const MAX_NAME_LENGTH = 255;

const dataRoomNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

const dataRoomParamsSchema = z.object({
    id: z.uuid(),
});

type DataRoomParams = z.infer<typeof dataRoomParamsSchema>;

const dataRoomSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

const createDataRoomBodySchema = z.object({
    name: dataRoomNameSchema,
});

type CreateDataRoomInput = z.infer<typeof createDataRoomBodySchema>;

const updateDataRoomBodySchema = z.object({
    name: dataRoomNameSchema,
});

type UpdateDataRoomInput = z.infer<typeof updateDataRoomBodySchema>;

const dataRoomResponseSchema = z.object({
    message: z.string(),
    data: z.object({ dataRoom: dataRoomSchema }),
});

type DataRoomResponse = z.infer<typeof dataRoomResponseSchema>;

const dataRoomsListResponseSchema = z.object({
    message: z.string(),
    data: paginationMetaSchema.extend({
        dataRooms: z.array(dataRoomSchema),
    }),
});

type DataRoomsListResponse = z.infer<typeof dataRoomsListResponseSchema>;

export {
    dataRoomSchema,
    dataRoomParamsSchema,
    createDataRoomBodySchema,
    updateDataRoomBodySchema,
    dataRoomResponseSchema,
    dataRoomsListResponseSchema,
};

export type {
    DataRoomParams,
    CreateDataRoomInput,
    UpdateDataRoomInput,
    DataRoomResponse,
    DataRoomsListResponse,
};
