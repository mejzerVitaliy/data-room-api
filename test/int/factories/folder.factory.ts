import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

export const createFolder = async (params: {
    prisma: PrismaClient;
    dataRoomId: string;
    parentId?: string | null;
    overrides?: Partial<{ name: string }>;
}) => {
    const { prisma, dataRoomId, parentId = null, overrides = {} } = params;

    return prisma.folder.create({
        data: {
            dataRoomId,
            parentId,
            name: overrides.name ?? `Folder ${randomUUID()}`,
        },
    });
};
