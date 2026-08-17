import { FastifyInstance } from "fastify";
import { createUser } from "../factories/user.factory.js";
import { createFile } from "../factories/file.factory.js";
import { buildServer } from "../setup/build-server.js";
import { createFolder } from "../factories/folder.factory.js";
import { createDataRoom } from "../factories/data-room.factory.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("folder delete cascade journey", () => {
    let server: FastifyInstance;
    let teardown: () => Promise<void>;

    beforeEach(async () => {
        ({ server, teardown } = await buildServer());
    });

    afterEach(async () => {
        await teardown();
    });

    it("computes an accurate delete preview and purges nested folders and files on delete", async () => {
        const owner = await createUser({ prisma: server.prisma });
        const dataRoom = await createDataRoom({
            prisma: server.prisma,
            ownerId: owner.id,
        });
        const parent = await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
        });
        const child = await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            parentId: parent.id,
        });
        await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            folderId: parent.id,
            overrides: { sizeBytes: 1000 },
        });
        await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            folderId: child.id,
            overrides: { sizeBytes: 2000 },
        });

        const accessToken = server.jwt.sign({
            id: owner.id,
            email: owner.email,
            type: "access",
        });
        const authHeader = { authorization: `Bearer ${accessToken}` };

        const previewResponse = await server.inject({
            method: "GET",
            url: `/api/folders/${parent.id}/delete-preview`,
            headers: authHeader,
        });

        expect(previewResponse.statusCode).toBe(200);
        expect(previewResponse.json().data).toMatchObject({
            folderCount: 1,
            fileCount: 2,
            totalSizeBytes: 3000,
        });

        const deleteResponse = await server.inject({
            method: "DELETE",
            url: `/api/folders/${parent.id}`,
            headers: authHeader,
        });

        expect(deleteResponse.statusCode).toBe(200);

        const remainingFolders = await server.prisma.folder.findMany({
            where: { dataRoomId: dataRoom.id },
        });
        const remainingFiles = await server.prisma.file.findMany({
            where: { dataRoomId: dataRoom.id },
        });

        expect(remainingFolders).toHaveLength(0);
        expect(remainingFiles).toHaveLength(0);

        const getDeletedFolderResponse = await server.inject({
            method: "GET",
            url: `/api/folders/${parent.id}`,
            headers: authHeader,
        });

        expect(getDeletedFolderResponse.statusCode).toBe(404);
    });
});
