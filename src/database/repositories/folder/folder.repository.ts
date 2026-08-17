import { Prisma, PrismaClient } from "@prisma/client";
import { NotFoundError } from "@/lib/errors/errors.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { generateRepository } from "../generate.repository.js";
import { FindUniqueOrFail } from "@/database/prisma/prisma.type.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { BaseRepository } from "@/database/repositories/repository.type.js";

export type FolderSubtreeStats = {
    folderCount: number;
    fileCount: number;
    totalSizeBytes: number;
};

export type FolderBreadcrumb = {
    id: string;
    name: string;
};

export type FolderRepository = BaseRepository<"folder"> & {
    findUniqueOrFail: FindUniqueOrFail<
        Prisma.FolderFindUniqueArgs,
        Prisma.$FolderPayload
    >;
    getSubtreeStats: (folderId: string) => Promise<FolderSubtreeStats>;
    getDescendantFolderIds: (folderId: string) => Promise<string[]>;
    getBreadcrumbs: (folderId: string) => Promise<FolderBreadcrumb[]>;
};

export const createFolderRepository = (
    prisma: PrismaClient
): FolderRepository => {
    const repository = generateRepository(prisma, "Folder");

    return {
        ...repository,
        findUniqueOrFail: async (args) => {
            const folder = await prisma.folder.findUnique(args);

            if (!folder) {
                throw new NotFoundError(RESPONSE_MESSAGES.folder.notFound);
            }

            return folder;
        },

        getSubtreeStats: async (folderId) => {
            const rows = await prisma.$queryRaw<
                {
                    folder_count: bigint;
                    file_count: bigint;
                    total_size_bytes: bigint | null;
                }[]
            >(Prisma.sql`
                WITH RECURSIVE subtree AS (
                    SELECT id FROM folders WHERE id = ${folderId}::uuid
                    UNION ALL
                    SELECT f.id FROM folders f
                    INNER JOIN subtree s ON f.parent_id = s.id
                )
                SELECT
                    (SELECT COUNT(*) FROM subtree) - 1 AS folder_count,
                    (SELECT COUNT(*) FROM files
                        WHERE folder_id IN (SELECT id FROM subtree)) AS file_count,
                    (SELECT COALESCE(SUM(size_bytes), 0) FROM files
                        WHERE folder_id IN (SELECT id FROM subtree)) AS total_size_bytes
            `);

            const stats = rows[0];

            return {
                folderCount: Number(stats?.folder_count ?? 0),
                fileCount: Number(stats?.file_count ?? 0),
                totalSizeBytes: Number(stats?.total_size_bytes ?? 0),
            };
        },

        getDescendantFolderIds: async (folderId) => {
            const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
                WITH RECURSIVE subtree AS (
                    SELECT id FROM folders WHERE id = ${folderId}::uuid
                    UNION ALL
                    SELECT f.id FROM folders f
                    INNER JOIN subtree s ON f.parent_id = s.id
                )
                SELECT id FROM subtree WHERE id != ${folderId}::uuid
            `);

            return rows.map((row) => row.id);
        },

        getBreadcrumbs: async (folderId) => {
            const rows = await prisma.$queryRaw<
                { id: string; name: string; depth: number }[]
            >(Prisma.sql`
                WITH RECURSIVE ancestors AS (
                    SELECT id, name, parent_id, 0 AS depth
                    FROM folders WHERE id = ${folderId}::uuid
                    UNION ALL
                    SELECT f.id, f.name, f.parent_id, a.depth + 1
                    FROM folders f
                    INNER JOIN ancestors a ON f.id = a.parent_id
                )
                SELECT id, name FROM ancestors ORDER BY depth DESC
            `);

            return rows.map(({ id, name }) => ({ id, name }));
        },
    };
};

addDIResolverName(createFolderRepository, "folderRepository");
