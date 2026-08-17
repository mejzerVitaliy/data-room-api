import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashing } from "@/lib/hashing/hashing.js";

export const createUser = async (params: {
    prisma: PrismaClient;
    overrides?: Partial<{ email: string; password: string; name: string }>;
}) => {
    const { prisma, overrides = {} } = params;
    const password = overrides.password ?? "password123";
    const passwordHash = await hashing.hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email: overrides.email ?? `user-${randomUUID()}@example.com`,
            passwordHash,
            name: overrides.name ?? "Test User",
        },
    });

    return { ...user, password };
};
