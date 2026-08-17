import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

export const createFile = async (params: {
    prisma: PrismaClient;
    dataRoomId: string;
    uploadedById: string;
    folderId?: string | null;
    overrides?: Partial<{
        name: string;
        storageKey: string;
        sizeBytes: number;
        mimeType: string;
    }>;
}) => {
    const {
        prisma,
        dataRoomId,
        uploadedById,
        folderId = null,
        overrides = {},
    } = params;

    return prisma.file.create({
        data: {
            dataRoomId,
            uploadedById,
            folderId,
            name: overrides.name ?? `file-${randomUUID()}.pdf`,
            storageKey:
                overrides.storageKey ??
                `data-rooms/${dataRoomId}/${randomUUID()}.pdf`,
            sizeBytes: overrides.sizeBytes ?? 1024,
            mimeType: overrides.mimeType ?? "application/pdf",
        },
    });
};
