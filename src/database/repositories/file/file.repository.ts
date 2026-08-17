import { Prisma, PrismaClient } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { generateRepository } from "../generate.repository.js";
import { FindUniqueOrFail } from "@/database/prisma/prisma.type.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { BaseRepository } from "@/database/repositories/repository.type.js";

export type FileRepository = BaseRepository<"file"> & {
    findUniqueOrFail: FindUniqueOrFail<
        Prisma.FileFindUniqueArgs,
        Prisma.$FilePayload
    >;
};

export const createFileRepository = (prisma: PrismaClient): FileRepository => {
    const repository = generateRepository(prisma, "File");

    return {
        ...repository,
        findUniqueOrFail: async (args) => {
            const file = await prisma.file.findUnique(args);

            if (!file) {
                throw new NotFoundError(RESPONSE_MESSAGES.file.notFound);
            }

            return file;
        },
    };
};

addDIResolverName(createFileRepository, "fileRepository");
