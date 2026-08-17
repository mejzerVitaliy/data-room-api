import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";

export const createDataRoom = async (params: {
    prisma: PrismaClient;
    ownerId: string;
    overrides?: Partial<{ name: string }>;
}) => {
    const { prisma, ownerId, overrides = {} } = params;

    return prisma.dataRoom.create({
        data: {
            ownerId,
            name: overrides.name ?? `Room ${randomUUID()}`,
        },
    });
};
