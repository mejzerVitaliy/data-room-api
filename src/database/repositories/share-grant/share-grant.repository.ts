import { Prisma, PrismaClient } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { generateRepository } from "../generate.repository.js";
import { FindUniqueOrFail } from "@/database/prisma/prisma.type.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { BaseRepository } from "@/database/repositories/repository.type.js";

export type ShareGrantRepository = BaseRepository<"shareGrant"> & {
    findUniqueOrFail: FindUniqueOrFail<
        Prisma.ShareGrantFindUniqueArgs,
        Prisma.$ShareGrantPayload
    >;
};

export const createShareGrantRepository = (
    prisma: PrismaClient
): ShareGrantRepository => {
    const repository = generateRepository(prisma, "ShareGrant");

    return {
        ...repository,
        findUniqueOrFail: async (args) => {
            const shareGrant = await prisma.shareGrant.findUnique(args);

            if (!shareGrant) {
                throw new NotFoundError(RESPONSE_MESSAGES.shareGrant.notFound);
            }

            return shareGrant;
        },
    };
};

addDIResolverName(createShareGrantRepository, "shareGrantRepository");
