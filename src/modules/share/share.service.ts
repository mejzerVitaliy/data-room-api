import { generateShareToken } from "./share.util.js";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { UserRepository } from "@/database/repositories/user/user.repository.js";
import { FileRepository } from "@/database/repositories/file/file.repository.js";
import { ShareRepository } from "@/database/repositories/share/share.repository.js";
import { FolderRepository } from "@/database/repositories/folder/folder.repository.js";
import { DataRoomRepository } from "@/database/repositories/data-room/data-room.repository.js";
import { ShareGrantRepository } from "@/database/repositories/share-grant/share-grant.repository.js";
import {
    SharingStateResponse,
    PublicShareResponse,
    PermissionedShareResponse,
} from "@/lib/validation/share/share.schema.js";
import {
    GetSharingStatePayload,
    EnablePublicSharePayload,
    RevokePublicSharePayload,
    SetPermissionedGranteesPayload,
    RevokePermissionedSharePayload,
} from "./share.type.js";

export type ShareService = {
    getSharingState: (
        payload: GetSharingStatePayload
    ) => Promise<SharingStateResponse>;
    enablePublicShare: (
        payload: EnablePublicSharePayload
    ) => Promise<PublicShareResponse>;
    revokePublicShare: (
        payload: RevokePublicSharePayload
    ) => Promise<{ message: string }>;
    setPermissionedGrantees: (
        payload: SetPermissionedGranteesPayload
    ) => Promise<PermissionedShareResponse>;
    revokePermissionedShare: (
        payload: RevokePermissionedSharePayload
    ) => Promise<{ message: string }>;
};

export const createService = (
    shareRepository: ShareRepository,
    shareGrantRepository: ShareGrantRepository,
    dataRoomRepository: DataRoomRepository,
    folderRepository: FolderRepository,
    fileRepository: FileRepository,
    userRepository: UserRepository
): ShareService => {
    const assertOwnsResource = async (params: {
        resourceType: "DATA_ROOM" | "FOLDER" | "FILE";
        resourceId: string;
        userId: string;
    }): Promise<string> => {
        const { resourceType, resourceId, userId } = params;

        if (resourceType === "DATA_ROOM") {
            const dataRoom = await dataRoomRepository.findUniqueOrFail({
                where: { id: resourceId },
            });

            if (dataRoom.ownerId !== userId) {
                throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
            }

            return dataRoom.id;
        }

        if (resourceType === "FOLDER") {
            const folder = await folderRepository.findUniqueOrFail({
                where: { id: resourceId },
            });

            const dataRoom = await dataRoomRepository.findUniqueOrFail({
                where: { id: folder.dataRoomId },
            });

            if (dataRoom.ownerId !== userId) {
                throw new NotFoundError(RESPONSE_MESSAGES.folder.notFound);
            }

            return folder.dataRoomId;
        }

        const file = await fileRepository.findUniqueOrFail({
            where: { id: resourceId },
        });

        const dataRoom = await dataRoomRepository.findUniqueOrFail({
            where: { id: file.dataRoomId },
        });

        if (dataRoom.ownerId !== userId) {
            throw new NotFoundError(RESPONSE_MESSAGES.file.notFound);
        }

        return file.dataRoomId;
    };

    return {
        getSharingState: async ({ userId, query }) => {
            await assertOwnsResource({ ...query, userId });

            const shares = await shareRepository.findMany({
                where: {
                    resourceType: query.resourceType,
                    resourceId: query.resourceId,
                    revokedAt: null,
                },
                include: { grants: true },
            });

            const publicShare =
                shares.find((share) => share.mode === "PUBLIC") ?? null;

            const permissionedShare =
                shares.find((share) => share.mode === "PERMISSIONED") ?? null;

            return {
                message: RESPONSE_MESSAGES.share.fetched,
                data: {
                    publicShare: publicShare
                        ? {
                            id: publicShare.id,
                            token: publicShare.publicToken ?? "",
                            createdAt: publicShare.createdAt,
                        }
                        : null,
                    permissionedShare: permissionedShare
                        ? {
                            id: permissionedShare.id,
                            grantees: permissionedShare.grants.map(
                                (grant) => ({
                                    id: grant.id,
                                    email: grant.granteeEmail,
                                    createdAt: grant.createdAt,
                                })
                            ),
                        }
                        : null,
                },
            };
        },

        enablePublicShare: async ({ userId, payload }) => {
            const dataRoomId = await assertOwnsResource({
                ...payload,
                userId,
            });

            const existing = await shareRepository.findFirst({
                where: {
                    resourceType: payload.resourceType,
                    resourceId: payload.resourceId,
                    mode: "PUBLIC",
                    revokedAt: null,
                },
            });

            if (existing) {
                return {
                    message: RESPONSE_MESSAGES.share.publicEnabled,
                    data: {
                        publicShare: {
                            id: existing.id,
                            token: existing.publicToken ?? "",
                            createdAt: existing.createdAt,
                        },
                    },
                };
            }

            const share = await shareRepository.create({
                data: {
                    resourceType: payload.resourceType,
                    resourceId: payload.resourceId,
                    dataRoomId,
                    ownerId: userId,
                    mode: "PUBLIC",
                    publicToken: generateShareToken(),
                },
            });

            return {
                message: RESPONSE_MESSAGES.share.publicEnabled,
                data: {
                    publicShare: {
                        id: share.id,
                        token: share.publicToken ?? "",
                        createdAt: share.createdAt,
                    },
                },
            };
        },

        revokePublicShare: async ({ userId, query }) => {
            await assertOwnsResource({ ...query, userId });

            const existing = await shareRepository.findFirst({
                where: {
                    resourceType: query.resourceType,
                    resourceId: query.resourceId,
                    mode: "PUBLIC",
                    revokedAt: null,
                },
            });

            if (!existing) {
                throw new NotFoundError(RESPONSE_MESSAGES.share.notFound);
            }

            await shareRepository.update({
                where: { id: existing.id },
                data: { revokedAt: new Date() },
            });

            return { message: RESPONSE_MESSAGES.share.publicRevoked };
        },

        setPermissionedGrantees: async ({ userId, payload }) => {
            const dataRoomId = await assertOwnsResource({
                ...payload,
                userId,
            });

            let share = await shareRepository.findFirst({
                where: {
                    resourceType: payload.resourceType,
                    resourceId: payload.resourceId,
                    mode: "PERMISSIONED",
                    revokedAt: null,
                },
            });

            if (!share) {
                share = await shareRepository.create({
                    data: {
                        resourceType: payload.resourceType,
                        resourceId: payload.resourceId,
                        dataRoomId,
                        ownerId: userId,
                        mode: "PERMISSIONED",
                    },
                });
            }

            const uniqueEmails = [
                ...new Set(
                    payload.granteeEmails.map((email) => email.toLowerCase())
                ),
            ];

            await shareGrantRepository.deleteMany({
                where: {
                    shareId: share.id,
                    granteeEmail: { notIn: uniqueEmails },
                },
            });

            const existingGrants = await shareGrantRepository.findMany({
                where: { shareId: share.id },
            });

            const existingEmails = new Set(
                existingGrants.map((grant) => grant.granteeEmail)
            );

            const newEmails = uniqueEmails.filter(
                (email) => !existingEmails.has(email)
            );

            if (newEmails.length > 0) {
                const matchingUsers = await userRepository.findMany({
                    where: { email: { in: newEmails } },
                    select: { id: true, email: true },
                });

                const emailToUserId = new Map(
                    matchingUsers.map((user) => [user.email, user.id])
                );

                await shareGrantRepository.createMany({
                    data: newEmails.map((email) => ({
                        shareId: share.id,
                        granteeEmail: email,
                        granteeUserId: emailToUserId.get(email) ?? null,
                    })),
                });
            }

            const grants = await shareGrantRepository.findMany({
                where: { shareId: share.id },
            });

            return {
                message: RESPONSE_MESSAGES.share.granteesUpdated,
                data: {
                    permissionedShare: {
                        id: share.id,
                        grantees: grants.map((grant) => ({
                            id: grant.id,
                            email: grant.granteeEmail,
                            createdAt: grant.createdAt,
                        })),
                    },
                },
            };
        },

        revokePermissionedShare: async ({ userId, query }) => {
            await assertOwnsResource({ ...query, userId });

            const existing = await shareRepository.findFirst({
                where: {
                    resourceType: query.resourceType,
                    resourceId: query.resourceId,
                    mode: "PERMISSIONED",
                    revokedAt: null,
                },
            });

            if (!existing) {
                throw new NotFoundError(RESPONSE_MESSAGES.share.notFound);
            }

            await shareRepository.update({
                where: { id: existing.id },
                data: { revokedAt: new Date() },
            });

            return { message: RESPONSE_MESSAGES.share.permissionedRevoked };
        },
    };
};

addDIResolverName(createService, "shareService");
