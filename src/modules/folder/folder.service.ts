import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { S3BucketService } from "@/lib/s3Bucket/s3Bucket.service.js";
import { ConflictError, NotFoundError } from "@/lib/errors/errors.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { DeletePreviewResponse } from "@/lib/validation/common/common.schema.js";
import { FileRepository } from "@/database/repositories/file/file.repository.js";
import { FolderRepository } from "@/database/repositories/folder/folder.repository.js";
import { DataRoomRepository } from "@/database/repositories/data-room/data-room.repository.js";
import {
    FolderResponse,
    FoldersListResponse,
} from "@/lib/validation/folder/folder.schema.js";
import {
    getPaginationSkipTake,
    buildPaginationMeta,
} from "@/lib/pagination/pagination.util.js";
import {
    ListFoldersPayload,
    CreateFolderPayload,
    GetFolderPayload,
    UpdateFolderPayload,
    DeleteFolderPayload,
} from "./folder.type.js";

export type FolderService = {
    list: (payload: ListFoldersPayload) => Promise<FoldersListResponse>;
    create: (payload: CreateFolderPayload) => Promise<FolderResponse>;
    getOne: (payload: GetFolderPayload) => Promise<FolderResponse>;
    update: (payload: UpdateFolderPayload) => Promise<FolderResponse>;
    remove: (payload: DeleteFolderPayload) => Promise<{ message: string }>;
    getDeletePreview: (
        payload: GetFolderPayload
    ) => Promise<DeletePreviewResponse>;
};

export const createService = (
    folderRepository: FolderRepository,
    dataRoomRepository: DataRoomRepository,
    fileRepository: FileRepository,
    s3BucketService: S3BucketService
): FolderService => {
    const assertOwnsDataRoom = async (dataRoomId: string, userId: string) => {
        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
        }
    };

    const assertOwnsFolder = async (folderId: string, userId: string) => {
        const folder = await folderRepository.findUniqueOrFail({
            where: { id: folderId },
        });

        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: folder.dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.folder.notFound);
        }

        return folder;
    };

    return {
        list: async ({ userId, query }) => {
            await assertOwnsDataRoom(query.dataRoomId, userId);

            let breadcrumbs: Awaited<
                ReturnType<typeof folderRepository.getBreadcrumbs>
            > = [];

            if (query.parentId) {
                const parent = await folderRepository.findUniqueOrFail({
                    where: { id: query.parentId },
                });

                if (parent.dataRoomId !== query.dataRoomId) {
                    throw new NotFoundError(RESPONSE_MESSAGES.folder.notFound);
                }

                breadcrumbs = await folderRepository.getBreadcrumbs(
                    query.parentId
                );
            }

            const { skip, take } = getPaginationSkipTake(query);

            const where = {
                dataRoomId: query.dataRoomId,
                parentId: query.parentId ?? null,
                ...(query.search
                    ? {
                        name: {
                            contains: query.search,
                            mode: "insensitive" as const,
                        },
                    }
                    : {}),
            };

            const [folders, total] = await Promise.all([
                folderRepository.findMany({
                    where,
                    orderBy: { [query.sortBy]: query.sortOrder },
                    skip,
                    take,
                }),
                folderRepository.count({ where }),
            ]);

            return {
                message: RESPONSE_MESSAGES.folder.fetched,
                data: {
                    ...buildPaginationMeta({ ...query, total }),
                    folders,
                    breadcrumbs,
                },
            };
        },

        create: async ({ userId, payload }) => {
            await assertOwnsDataRoom(payload.dataRoomId, userId);

            let parentId: string | null = null;

            if (payload.parentId != null) {
                const parent = await folderRepository.findUniqueOrFail({
                    where: { id: payload.parentId },
                });

                if (parent.dataRoomId !== payload.dataRoomId) {
                    throw new NotFoundError(RESPONSE_MESSAGES.folder.notFound);
                }

                parentId = parent.id;
            }

            const existing = await folderRepository.findFirst({
                where: {
                    dataRoomId: payload.dataRoomId,
                    parentId,
                    name: payload.name,
                },
            });

            if (existing) {
                throw new ConflictError(RESPONSE_MESSAGES.folder.nameTaken);
            }

            const folder = await folderRepository.create({
                data: {
                    dataRoomId: payload.dataRoomId,
                    parentId,
                    name: payload.name,
                },
            });

            const breadcrumbs = parentId
                ? await folderRepository.getBreadcrumbs(parentId)
                : [];

            return {
                message: RESPONSE_MESSAGES.folder.created,
                data: { folder, breadcrumbs },
            };
        },

        getOne: async ({ userId, folderId }) => {
            const folder = await assertOwnsFolder(folderId, userId);

            const breadcrumbs = await folderRepository.getBreadcrumbs(folderId);

            return {
                message: RESPONSE_MESSAGES.folder.fetched,
                data: { folder, breadcrumbs },
            };
        },

        update: async ({ userId, folderId, payload }) => {
            const folder = await assertOwnsFolder(folderId, userId);

            let newParentId = folder.parentId;

            if (payload.parentId !== undefined) {
                if (payload.parentId !== null) {
                    if (payload.parentId === folderId) {
                        throw new ConflictError(
                            RESPONSE_MESSAGES.folder.invalidParent
                        );
                    }

                    const newParent = await folderRepository.findUniqueOrFail({
                        where: { id: payload.parentId },
                    });

                    if (newParent.dataRoomId !== folder.dataRoomId) {
                        throw new NotFoundError(
                            RESPONSE_MESSAGES.folder.notFound
                        );
                    }

                    const descendantIds =
                        await folderRepository.getDescendantFolderIds(folderId);

                    if (descendantIds.includes(payload.parentId)) {
                        throw new ConflictError(
                            RESPONSE_MESSAGES.folder.invalidParent
                        );
                    }
                }

                newParentId = payload.parentId;
            }

            const newName = payload.name ?? folder.name;

            const conflicting = await folderRepository.findFirst({
                where: {
                    dataRoomId: folder.dataRoomId,
                    parentId: newParentId,
                    name: newName,
                    id: { not: folderId },
                },
            });

            if (conflicting) {
                throw new ConflictError(RESPONSE_MESSAGES.folder.nameTaken);
            }

            const updated = await folderRepository.update({
                where: { id: folderId },
                data: { name: newName, parentId: newParentId },
            });

            const breadcrumbs = newParentId
                ? await folderRepository.getBreadcrumbs(newParentId)
                : [];

            const message =
                payload.parentId === undefined
                    ? RESPONSE_MESSAGES.folder.renamed
                    : RESPONSE_MESSAGES.folder.moved;

            return { message, data: { folder: updated, breadcrumbs } };
        },

        remove: async ({ userId, folderId }) => {
            await assertOwnsFolder(folderId, userId);

            const descendantIds =
                await folderRepository.getDescendantFolderIds(folderId);

            const subtreeFolderIds = [folderId, ...descendantIds];

            const filesToPurge = await fileRepository.findMany({
                where: { folderId: { in: subtreeFolderIds } },
                select: { storageKey: true },
            });

            await folderRepository.delete({ where: { id: folderId } });

            if (filesToPurge.length > 0) {
                await s3BucketService.deleteFiles({
                    keys: filesToPurge.map(({ storageKey }) => storageKey),
                });
            }

            return { message: RESPONSE_MESSAGES.folder.deleted };
        },

        getDeletePreview: async ({ userId, folderId }) => {
            await assertOwnsFolder(folderId, userId);

            const stats = await folderRepository.getSubtreeStats(folderId);

            return {
                message: RESPONSE_MESSAGES.folder.deletePreview,
                data: stats,
            };
        },
    };
};

addDIResolverName(createService, "folderService");
