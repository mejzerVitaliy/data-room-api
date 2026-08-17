import { Prisma, PrismaClient } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { generateRepository } from "../generate.repository.js";
import { FindUniqueOrFail } from "@/database/prisma/prisma.type.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { BaseRepository } from "@/database/repositories/repository.type.js";

export type DataRoomContentsStats = {
    folderCount: number;
    fileCount: number;
    totalSizeBytes: number;
};

export type DataRoomRepository = BaseRepository<"dataRoom"> & {
    findUniqueOrFail: FindUniqueOrFail<
        Prisma.DataRoomFindUniqueArgs,
        Prisma.$DataRoomPayload
    >;
    getContentsStats: (dataRoomId: string) => Promise<DataRoomContentsStats>;
};

export const createDataRoomRepository = (
    prisma: PrismaClient
): DataRoomRepository => {
    const repository = generateRepository(prisma, "DataRoom");

    return {
        ...repository,
        findUniqueOrFail: async (args) => {
            const dataRoom = await prisma.dataRoom.findUnique(args);

            if (!dataRoom) {
                throw new NotFoundError(RESPONSE_MESSAGES.dataRoom.notFound);
            }

            return dataRoom;
        },

        getContentsStats: async (dataRoomId) => {
            const [folderCount, fileAggregate] = await Promise.all([
                prisma.folder.count({ where: { dataRoomId } }),
                prisma.file.aggregate({
                    where: { dataRoomId },
                    _count: true,
                    _sum: { sizeBytes: true },
                }),
            ]);

            return {
                folderCount,
                fileCount: fileAggregate._count,
                totalSizeBytes: fileAggregate._sum.sizeBytes ?? 0,
            };
        },
    };
};

addDIResolverName(createDataRoomRepository, "dataRoomRepository");
