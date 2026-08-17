import { Prisma } from "@prisma/client";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { S3BucketService } from "@/lib/s3Bucket/s3Bucket.service.js";
import { ConflictError, NotFoundError } from "@/lib/errors/errors.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { FileRepository } from "@/database/repositories/file/file.repository.js";
import { FolderRepository } from "@/database/repositories/folder/folder.repository.js";
import { PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE } from "@/lib/constants/prisma.constant.js";
import { DataRoomRepository } from "@/database/repositories/data-room/data-room.repository.js";
import {
    buildStorageKey,
    buildFileTypeWhere,
    buildViewDisposition,
} from "./file.util.js";
import {
    getPaginationSkipTake,
    buildPaginationMeta,
} from "@/lib/pagination/pagination.util.js";
import {
    FileResponse,
    FilesListResponse,
    CreateUploadUrlResponse,
    FileWithViewUrlResponse,
} from "@/lib/validation/file/file.schema.js";
import {
    CreateUploadUrlPayload,
    CompleteUploadPayload,
    ListFilesPayload,
    GetFilePayload,
    UpdateFilePayload,
    DeleteFilePayload,
} from "./file.type.js";

export type FileService = {
    createUploadUrl: (
        payload: CreateUploadUrlPayload
    ) => Promise<CreateUploadUrlResponse>;
    completeUpload: (payload: CompleteUploadPayload) => Promise<FileResponse>;
    list: (payload: ListFilesPayload) => Promise<FilesListResponse>;
    getOne: (payload: GetFilePayload) => Promise<FileWithViewUrlResponse>;
    update: (payload: UpdateFilePayload) => Promise<FileResponse>;
    remove: (payload: DeleteFilePayload) => Promise<{ message: string }>;
};

export const createService = (
    fileRepository: FileRepository,
    folderRepository: FolderRepository,
    dataRoomRepository: DataRoomRepository,
    s3BucketService: S3BucketService
): FileService => {
    const assertOwnsDataRoom = async (dataRoomId: string, userId: string) => {
        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
        }
    };

    const assertValidFolder = async (folderId: string, dataRoomId: string) => {
        const folder = await folderRepository.findUniqueOrFail({
            where: { id: folderId },
        });

        if (folder.dataRoomId !== dataRoomId) {
            throw new NotFoundError(RESPONSE_MESSAGES.folder.notFound);
        }
    };

    const assertOwnsFile = async (fileId: string, userId: string) => {
        const file = await fileRepository.findUniqueOrFail({
            where: { id: fileId },
        });

        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: file.dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.file.notFound);
        }

        return file;
    };

    const assertNameAvailable = async (params: {
        dataRoomId: string;
        folderId: string | null;
        name: string;
        excludeFileId?: string;
    }) => {
        const { dataRoomId, folderId, name, excludeFileId } = params;

        const existing = await fileRepository.findFirst({
            where: {
                dataRoomId,
                folderId,
                name,
                ...(excludeFileId ? { id: { not: excludeFileId } } : {}),
            },
        });

        if (existing) {
            throw new ConflictError(RESPONSE_MESSAGES.file.nameTaken);
        }
    };

    return {
        createUploadUrl: async ({ userId, payload }) => {
            await assertOwnsDataRoom(payload.dataRoomId, userId);

            const folderId = payload.folderId ?? null;

            if (folderId !== null) {
                await assertValidFolder(folderId, payload.dataRoomId);
            }

            await assertNameAvailable({
                dataRoomId: payload.dataRoomId,
                folderId,
                name: payload.name,
            });

            const storageKey = buildStorageKey({
                dataRoomId: payload.dataRoomId,
                fileName: payload.name,
            });

            const uploadUrl = await s3BucketService.createUploadSignedUrl({
                key: storageKey,
                contentType: payload.mimeType,
            });

            return {
                message: RESPONSE_MESSAGES.file.uploadUrlCreated,
                data: { uploadUrl, storageKey },
            };
        },

        completeUpload: async ({ userId, payload }) => {
            await assertOwnsDataRoom(payload.dataRoomId, userId);

            const folderId = payload.folderId ?? null;

            if (folderId !== null) {
                await assertValidFolder(folderId, payload.dataRoomId);
            }

            await assertNameAvailable({
                dataRoomId: payload.dataRoomId,
                folderId,
                name: payload.name,
            });

            const file = await fileRepository
                .create({
                    data: {
                        dataRoomId: payload.dataRoomId,
                        folderId,
                        name: payload.name,
                        mimeType: payload.mimeType,
                        sizeBytes: payload.sizeBytes,
                        storageKey: payload.storageKey,
                        uploadedById: userId,
                    },
                })
                .catch((error: unknown) => {
                    if (
                        error instanceof Prisma.PrismaClientKnownRequestError &&
                        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE
                    ) {
                        throw new ConflictError(
                            RESPONSE_MESSAGES.file.nameTaken
                        );
                    }

                    throw error;
                });

            return {
                message: RESPONSE_MESSAGES.file.created,
                data: { file },
            };
        },

        list: async ({ userId, query }) => {
            await assertOwnsDataRoom(query.dataRoomId, userId);

            let breadcrumbs: Awaited<
                ReturnType<typeof folderRepository.getBreadcrumbs>
            > = [];

            if (query.folderId) {
                await assertValidFolder(query.folderId, query.dataRoomId);

                breadcrumbs = await folderRepository.getBreadcrumbs(
                    query.folderId
                );
            }

            const { skip, take } = getPaginationSkipTake(query);

            const where = {
                dataRoomId: query.dataRoomId,
                folderId: query.folderId ?? null,
                ...(query.search
                    ? {
                        name: {
                            contains: query.search,
                            mode: "insensitive" as const,
                        },
                    }
                    : {}),
                ...buildFileTypeWhere(query.fileType),
            };

            const [files, total] = await Promise.all([
                fileRepository.findMany({
                    where,
                    orderBy: { [query.sortBy]: query.sortOrder },
                    skip,
                    take,
                }),
                fileRepository.count({ where }),
            ]);

            return {
                message: RESPONSE_MESSAGES.file.fetched,
                data: {
                    ...buildPaginationMeta({ ...query, total }),
                    files,
                    breadcrumbs,
                },
            };
        },

        getOne: async ({ userId, fileId }) => {
            const file = await assertOwnsFile(fileId, userId);

            const viewUrl = await s3BucketService.createReadSignedUrl({
                key: file.storageKey,
                responseContentDisposition: buildViewDisposition(file.mimeType),
            });

            return {
                message: RESPONSE_MESSAGES.file.fetched,
                data: { file, viewUrl },
            };
        },

        update: async ({ userId, fileId, payload }) => {
            const file = await assertOwnsFile(fileId, userId);

            let newFolderId = file.folderId;

            if (payload.folderId !== undefined) {
                if (payload.folderId !== null) {
                    await assertValidFolder(payload.folderId, file.dataRoomId);
                }

                newFolderId = payload.folderId;
            }

            const newName = payload.name ?? file.name;

            await assertNameAvailable({
                dataRoomId: file.dataRoomId,
                folderId: newFolderId,
                name: newName,
                excludeFileId: fileId,
            });

            const updated = await fileRepository.update({
                where: { id: fileId },
                data: { name: newName, folderId: newFolderId },
            });

            const message =
                payload.folderId === undefined
                    ? RESPONSE_MESSAGES.file.renamed
                    : RESPONSE_MESSAGES.file.moved;

            return { message, data: { file: updated } };
        },

        remove: async ({ userId, fileId }) => {
            const file = await assertOwnsFile(fileId, userId);

            await fileRepository.delete({ where: { id: fileId } });
            await s3BucketService.deleteFile({ key: file.storageKey });

            return { message: RESPONSE_MESSAGES.file.deleted };
        },
    };
};

addDIResolverName(createService, "fileService");
