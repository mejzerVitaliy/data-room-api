import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { S3BucketService } from "@/lib/s3Bucket/s3Bucket.service.js";
import { ConflictError, NotFoundError } from "@/lib/errors/errors.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { DeletePreviewResponse } from "@/lib/validation/common/common.schema.js";
import { FileRepository } from "@/database/repositories/file/file.repository.js";
import { DataRoomRepository } from "@/database/repositories/data-room/data-room.repository.js";
import {
    getPaginationSkipTake,
    buildPaginationMeta,
} from "@/lib/pagination/pagination.util.js";
import {
    DataRoomResponse,
    DataRoomsListResponse,
} from "@/lib/validation/data-room/data-room.schema.js";
import {
    CreateDataRoomPayload,
    ListDataRoomsPayload,
    GetDataRoomPayload,
    UpdateDataRoomPayload,
    DeleteDataRoomPayload,
} from "./data-room.type.js";

export type DataRoomService = {
    create: (payload: CreateDataRoomPayload) => Promise<DataRoomResponse>;
    list: (payload: ListDataRoomsPayload) => Promise<DataRoomsListResponse>;
    getOne: (payload: GetDataRoomPayload) => Promise<DataRoomResponse>;
    update: (payload: UpdateDataRoomPayload) => Promise<DataRoomResponse>;
    remove: (payload: DeleteDataRoomPayload) => Promise<{ message: string }>;
    getDeletePreview: (
        payload: GetDataRoomPayload
    ) => Promise<DeletePreviewResponse>;
};

export const createService = (
    dataRoomRepository: DataRoomRepository,
    fileRepository: FileRepository,
    s3BucketService: S3BucketService
): DataRoomService => ({
    create: async ({ userId, payload }) => {
        const existing = await dataRoomRepository.findFirst({
            where: { ownerId: userId, name: payload.name },
        });

        if (existing) {
            throw new ConflictError(RESPONSE_MESSAGES.dataRoom.nameTaken);
        }

        const dataRoom = await dataRoomRepository.create({
            data: { ownerId: userId, name: payload.name },
        });

        return {
            message: RESPONSE_MESSAGES.dataRoom.created,
            data: { dataRoom },
        };
    },

    list: async ({ userId, query }) => {
        const { skip, take } = getPaginationSkipTake(query);

        const [dataRooms, total] = await Promise.all([
            dataRoomRepository.findMany({
                where: { ownerId: userId },
                orderBy: { createdAt: "desc" },
                skip,
                take,
            }),
            dataRoomRepository.count({ where: { ownerId: userId } }),
        ]);

        return {
            message: RESPONSE_MESSAGES.dataRoom.fetched,
            data: {
                dataRooms,
                ...buildPaginationMeta({ ...query, total }),
            },
        };
    },

    getOne: async ({ userId, dataRoomId }) => {
        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
        }

        return {
            message: RESPONSE_MESSAGES.dataRoom.fetched,
            data: { dataRoom },
        };
    },

    update: async ({ userId, dataRoomId, payload }) => {
        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
        }

        const conflicting = await dataRoomRepository.findFirst({
            where: {
                ownerId: userId,
                name: payload.name,
                id: { not: dataRoomId },
            },
        });

        if (conflicting) {
            throw new ConflictError(RESPONSE_MESSAGES.dataRoom.nameTaken);
        }

        const updated = await dataRoomRepository.update({
            where: { id: dataRoomId },
            data: { name: payload.name },
        });

        return {
            message: RESPONSE_MESSAGES.dataRoom.renamed,
            data: { dataRoom: updated },
        };
    },

    remove: async ({ userId, dataRoomId }) => {
        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
        }

        const filesToPurge = await fileRepository.findMany({
            where: { dataRoomId },
            select: { storageKey: true },
        });

        await dataRoomRepository.delete({ where: { id: dataRoomId } });

        if (filesToPurge.length > 0) {
            await s3BucketService.deleteFiles({
                keys: filesToPurge.map(({ storageKey }) => storageKey),
            });
        }

        return { message: RESPONSE_MESSAGES.dataRoom.deleted };
    },

    getDeletePreview: async ({ userId, dataRoomId }) => {
        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
        }

        const stats = await dataRoomRepository.getContentsStats(dataRoomId);

        return {
            message: RESPONSE_MESSAGES.dataRoom.deletePreview,
            data: stats,
        };
    },
});

addDIResolverName(createService, "dataRoomService");
