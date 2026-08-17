import { Share, ShareGrant } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { buildViewDisposition } from "@/modules/file/file.util.js";
import { S3BucketService } from "@/lib/s3Bucket/s3Bucket.service.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { FileRepository } from "@/database/repositories/file/file.repository.js";
import { ShareRepository } from "@/database/repositories/share/share.repository.js";
import { FolderRepository } from "@/database/repositories/folder/folder.repository.js";
import { DataRoomRepository } from "@/database/repositories/data-room/data-room.repository.js";
import { ShareGrantRepository } from "@/database/repositories/share-grant/share-grant.repository.js";
import {
    getPaginationSkipTake,
    buildPaginationMeta,
} from "@/lib/pagination/pagination.util.js";
import {
    SharedFileResponse,
    SharedContentsResponse,
    SharedWithMeListResponse,
} from "@/lib/validation/shared-access/shared-access.schema.js";
import {
    PublicEntryPayload,
    PublicFilePayload,
    PublicFolderPayload,
    ListMySharesPayload,
    PermissionedFilePayload,
    PermissionedFolderPayload,
    PermissionedDataRoomPayload,
} from "./shared-access.type.js";

type ShareWithGrants = Share & { grants: ShareGrant[] };

export type SharedAccessService = {
    resolvePublicEntry: (
        payload: PublicEntryPayload
    ) => Promise<SharedContentsResponse | SharedFileResponse>;
    browsePublicFolder: (
        payload: PublicFolderPayload
    ) => Promise<SharedContentsResponse>;
    viewPublicFile: (payload: PublicFilePayload) => Promise<SharedFileResponse>;
    listMyShares: (
        payload: ListMySharesPayload
    ) => Promise<SharedWithMeListResponse>;
    resolvePermissionedDataRoom: (
        payload: PermissionedDataRoomPayload
    ) => Promise<SharedContentsResponse>;
    browsePermissionedFolder: (
        payload: PermissionedFolderPayload
    ) => Promise<SharedContentsResponse>;
    viewPermissionedFile: (
        payload: PermissionedFilePayload
    ) => Promise<SharedFileResponse>;
};

export const createService = (
    shareRepository: ShareRepository,
    shareGrantRepository: ShareGrantRepository,
    dataRoomRepository: DataRoomRepository,
    folderRepository: FolderRepository,
    fileRepository: FileRepository,
    s3BucketService: S3BucketService
): SharedAccessService => {
    const findCoveringShares = async (params: {
        dataRoomId: string;
        ancestorFolderIds: string[];
        fileId?: string;
    }): Promise<ShareWithGrants[]> => {
        const { dataRoomId, ancestorFolderIds, fileId } = params;

        return shareRepository.findMany({
            where: {
                revokedAt: null,
                OR: [
                    { resourceType: "DATA_ROOM", resourceId: dataRoomId },
                    ...(ancestorFolderIds.length > 0
                        ? [
                            {
                                resourceType: "FOLDER" as const,
                                resourceId: { in: ancestorFolderIds },
                            },
                        ]
                        : []),
                    ...(fileId
                        ? [
                            {
                                resourceType: "FILE" as const,
                                resourceId: fileId,
                            },
                        ]
                        : []),
                ],
            },
            include: { grants: true },
        });
    };

    const requirePublicMatch = (
        shares: ShareWithGrants[],
        token: string
    ): ShareWithGrants => {
        const match = shares.find(
            (share) => share.mode === "PUBLIC" && share.publicToken === token
        );

        if (!match) {
            throw new NotFoundError(RESPONSE_MESSAGES.share.invalidResource);
        }

        return match;
    };

    const requirePermissionedMatch = (
        shares: ShareWithGrants[],
        userId: string,
        userEmail: string
    ): ShareWithGrants => {
        const match = shares.find(
            (share) =>
                share.mode === "PERMISSIONED" &&
                share.grants.some(
                    (grant) =>
                        grant.granteeUserId === userId ||
                        grant.granteeEmail === userEmail
                )
        );

        if (!match) {
            throw new NotFoundError(RESPONSE_MESSAGES.share.invalidResource);
        }

        return match;
    };

    const truncateBreadcrumbs = (
        share: ShareWithGrants,
        breadcrumbs: { id: string; name: string }[]
    ) => {
        if (share.resourceType !== "FOLDER") {
            return breadcrumbs;
        }

        const rootIndex = breadcrumbs.findIndex(
            (crumb) => crumb.id === share.resourceId
        );

        return rootIndex >= 0 ? breadcrumbs.slice(rootIndex) : breadcrumbs;
    };

    const buildContentsResponse = async (params: {
        share: ShareWithGrants;
        dataRoomId: string;
        folderId: string | null;
        query: { page: number; perPage: number };
    }): Promise<SharedContentsResponse> => {
        const { share, dataRoomId, folderId, query } = params;

        const [dataRoom, folder, breadcrumbs] = await Promise.all([
            dataRoomRepository.findUniqueOrFail({
                where: { id: dataRoomId },
            }),
            folderId
                ? folderRepository.findUniqueOrFail({
                    where: { id: folderId },
                })
                : Promise.resolve(null),
            folderId
                ? folderRepository.getBreadcrumbs(folderId)
                : Promise.resolve([]),
        ]);

        const { skip, take } = getPaginationSkipTake(query);
        const folderWhere = { dataRoomId, parentId: folderId };
        const fileWhere = { dataRoomId, folderId };

        const [folders, files, foldersTotal, filesTotal] = await Promise.all([
            folderRepository.findMany({
                where: folderWhere,
                orderBy: { name: "asc" },
                skip,
                take,
            }),
            fileRepository.findMany({
                where: fileWhere,
                orderBy: { name: "asc" },
                skip,
                take,
            }),
            folderRepository.count({ where: folderWhere }),
            fileRepository.count({ where: fileWhere }),
        ]);

        const total = foldersTotal + filesTotal;
        const paginationMeta = buildPaginationMeta({ ...query, total });

        const totalPages = Math.max(
            Math.ceil(foldersTotal / query.perPage),
            Math.ceil(filesTotal / query.perPage),
            1
        );

        return {
            message: RESPONSE_MESSAGES.share.fetched,
            data: {
                resourceType: share.resourceType,
                dataRoomName: dataRoom.name,
                folder,
                breadcrumbs: truncateBreadcrumbs(share, breadcrumbs),
                ...paginationMeta,
                totalPages,
                nextPage: query.page < totalPages ? query.page + 1 : null,
                folders,
                files,
            },
        };
    };

    const buildFileResponse = async (params: {
        share: ShareWithGrants;
        fileId: string;
        dataRoomId: string;
    }): Promise<SharedFileResponse> => {
        const { share, fileId, dataRoomId } = params;

        const [dataRoom, file] = await Promise.all([
            dataRoomRepository.findUniqueOrFail({
                where: { id: dataRoomId },
            }),
            fileRepository.findUniqueOrFail({ where: { id: fileId } }),
        ]);

        const viewUrl = await s3BucketService.createReadSignedUrl({
            key: file.storageKey,
            responseContentDisposition: buildViewDisposition(file.mimeType),
        });

        return {
            message: RESPONSE_MESSAGES.share.fetched,
            data: {
                resourceType: share.resourceType,
                dataRoomName: dataRoom.name,
                file,
                viewUrl,
            },
        };
    };

    const contextForFolder = async (folderId: string) => {
        const folder = await folderRepository.findUniqueOrFail({
            where: { id: folderId },
        });

        const breadcrumbs = await folderRepository.getBreadcrumbs(folderId);

        return {
            dataRoomId: folder.dataRoomId,
            ancestorFolderIds: breadcrumbs.map((crumb) => crumb.id),
        };
    };

    const contextForFile = async (fileId: string) => {
        const file = await fileRepository.findUniqueOrFail({
            where: { id: fileId },
        });

        const ancestorFolderIds = file.folderId
            ? (await folderRepository.getBreadcrumbs(file.folderId)).map(
                (crumb) => crumb.id
            )
            : [];

        return { dataRoomId: file.dataRoomId, ancestorFolderIds };
    };

    return {
        resolvePublicEntry: async ({ token, query }) => {
            const share = await shareRepository.findFirst({
                where: { publicToken: token, mode: "PUBLIC", revokedAt: null },
                include: { grants: true },
            });

            if (!share) {
                throw new NotFoundError(
                    RESPONSE_MESSAGES.share.invalidResource
                );
            }

            if (share.resourceType === "FILE") {
                return buildFileResponse({
                    share,
                    fileId: share.resourceId,
                    dataRoomId: share.dataRoomId,
                });
            }

            const rootFolderId =
                share.resourceType === "FOLDER" ? share.resourceId : null;

            return buildContentsResponse({
                share,
                dataRoomId: share.dataRoomId,
                folderId: rootFolderId,
                query,
            });
        },

        browsePublicFolder: async ({ token, folderId, query }) => {
            const { dataRoomId, ancestorFolderIds } =
                await contextForFolder(folderId);

            const shares = await findCoveringShares({
                dataRoomId,
                ancestorFolderIds,
            });

            const share = requirePublicMatch(shares, token);

            return buildContentsResponse({
                share,
                dataRoomId,
                folderId,
                query,
            });
        },

        viewPublicFile: async ({ token, fileId }) => {
            const { dataRoomId, ancestorFolderIds } =
                await contextForFile(fileId);

            const shares = await findCoveringShares({
                dataRoomId,
                ancestorFolderIds,
                fileId,
            });

            const share = requirePublicMatch(shares, token);

            return buildFileResponse({ share, fileId, dataRoomId });
        },

        listMyShares: async ({ userId, userEmail, query }) => {
            const { skip, take } = getPaginationSkipTake(query);

            const where = {
                OR: [{ granteeUserId: userId }, { granteeEmail: userEmail }],
                share: { mode: "PERMISSIONED" as const, revokedAt: null },
            };

            const [grants, total] = await Promise.all([
                shareGrantRepository.findMany({
                    where,
                    include: { share: true },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take,
                }),
                shareGrantRepository.count({ where }),
            ]);

            const dataRoomIds = grants
                .filter((grant) => grant.share.resourceType === "DATA_ROOM")
                .map((grant) => grant.share.resourceId);

            const folderIds = grants
                .filter((grant) => grant.share.resourceType === "FOLDER")
                .map((grant) => grant.share.resourceId);

            const fileIds = grants
                .filter((grant) => grant.share.resourceType === "FILE")
                .map((grant) => grant.share.resourceId);

            const allDataRoomIds = [
                ...new Set([
                    ...dataRoomIds,
                    ...grants.map((grant) => grant.share.dataRoomId),
                ]),
            ];

            const [dataRooms, folders, files] = await Promise.all([
                dataRoomRepository.findMany({
                    where: { id: { in: allDataRoomIds } },
                }),
                folderIds.length > 0
                    ? folderRepository.findMany({
                        where: { id: { in: folderIds } },
                    })
                    : Promise.resolve([]),
                fileIds.length > 0
                    ? fileRepository.findMany({
                        where: { id: { in: fileIds } },
                    })
                    : Promise.resolve([]),
            ]);

            const dataRoomNameById = new Map(
                dataRooms.map((dataRoom) => [dataRoom.id, dataRoom.name])
            );

            const folderNameById = new Map(
                folders.map((folder) => [folder.id, folder.name])
            );

            const fileNameById = new Map(
                files.map((file) => [file.id, file.name])
            );

            const shares = grants.map((grant) => {
                const { share } = grant;

                const name =
                    share.resourceType === "DATA_ROOM"
                        ? (dataRoomNameById.get(share.resourceId) ?? "")
                        : share.resourceType === "FOLDER"
                            ? (folderNameById.get(share.resourceId) ?? "")
                            : (fileNameById.get(share.resourceId) ?? "");

                return {
                    shareId: share.id,
                    resourceType: share.resourceType,
                    resourceId: share.resourceId,
                    name,
                    dataRoomName: dataRoomNameById.get(share.dataRoomId) ?? "",
                    sharedAt: grant.createdAt,
                };
            });

            return {
                message: RESPONSE_MESSAGES.share.fetched,
                data: {
                    ...buildPaginationMeta({ ...query, total }),
                    shares,
                },
            };
        },

        resolvePermissionedDataRoom: async ({
            userId,
            userEmail,
            dataRoomId,
            query,
        }) => {
            const shares = await findCoveringShares({
                dataRoomId,
                ancestorFolderIds: [],
            });

            const share = requirePermissionedMatch(shares, userId, userEmail);

            return buildContentsResponse({
                share,
                dataRoomId,
                folderId: null,
                query,
            });
        },

        browsePermissionedFolder: async ({
            userId,
            userEmail,
            folderId,
            query,
        }) => {
            const { dataRoomId, ancestorFolderIds } =
                await contextForFolder(folderId);

            const shares = await findCoveringShares({
                dataRoomId,
                ancestorFolderIds,
            });

            const share = requirePermissionedMatch(shares, userId, userEmail);

            return buildContentsResponse({
                share,
                dataRoomId,
                folderId,
                query,
            });
        },

        viewPermissionedFile: async ({ userId, userEmail, fileId }) => {
            const { dataRoomId, ancestorFolderIds } =
                await contextForFile(fileId);

            const shares = await findCoveringShares({
                dataRoomId,
                ancestorFolderIds,
                fileId,
            });

            const share = requirePermissionedMatch(shares, userId, userEmail);

            return buildFileResponse({ share, fileId, dataRoomId });
        },
    };
};

addDIResolverName(createService, "sharedAccessService");
