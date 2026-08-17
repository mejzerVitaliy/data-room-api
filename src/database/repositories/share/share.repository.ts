import { Prisma, PrismaClient } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { generateRepository } from "../generate.repository.js";
import { FindUniqueOrFail } from "@/database/prisma/prisma.type.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { BaseRepository } from "@/database/repositories/repository.type.js";

export type ShareRepository = BaseRepository<"share"> & {
    findUniqueOrFail: FindUniqueOrFail<
        Prisma.ShareFindUniqueArgs,
        Prisma.$SharePayload
    >;
};

export const createShareRepository = (
    prisma: PrismaClient
): ShareRepository => {
    const repository = generateRepository(prisma, "Share");

    return {
        ...repository,
        findUniqueOrFail: async (args) => {
            const share = await prisma.share.findUnique(args);

            if (!share) {
                throw new NotFoundError(RESPONSE_MESSAGES.share.notFound);
            }

            return share;
        },
    };
};

addDIResolverName(createShareRepository, "shareRepository");
