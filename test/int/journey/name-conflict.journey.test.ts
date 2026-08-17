import { FastifyInstance } from "fastify";
import { createUser } from "../factories/user.factory.js";
import { createFile } from "../factories/file.factory.js";
import { buildServer } from "../setup/build-server.js";
import { createFolder } from "../factories/folder.factory.js";
import { createDataRoom } from "../factories/data-room.factory.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("name conflict journey", () => {
    let server: FastifyInstance;
    let teardown: () => Promise<void>;

    beforeEach(async () => {
        ({ server, teardown } = await buildServer());
    });

    afterEach(async () => {
        await teardown();
    });

    it("rejects a duplicate folder name, a duplicate file name, a conflicting rename, and a conflicting move", async () => {
        const owner = await createUser({ prisma: server.prisma });
        const dataRoom = await createDataRoom({
            prisma: server.prisma,
            ownerId: owner.id,
        });
        const accessToken = server.jwt.sign({
            id: owner.id,
            email: owner.email,
            type: "access",
        });
        const authHeader = { authorization: `Bearer ${accessToken}` };

        await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            overrides: { name: "Reports" },
        });

        const duplicateFolderResponse = await server.inject({
            method: "POST",
            url: "/api/folders",
            headers: authHeader,
            payload: { dataRoomId: dataRoom.id, name: "Reports" },
        });

        expect(duplicateFolderResponse.statusCode).toBe(409);

        await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            overrides: { name: "nda.pdf" },
        });

        const duplicateFileResponse = await server.inject({
            method: "POST",
            url: "/api/files",
            headers: authHeader,
            payload: {
                dataRoomId: dataRoom.id,
                name: "nda.pdf",
                mimeType: "application/pdf",
                sizeBytes: 10,
                storageKey: "irrelevant-key",
            },
        });

        expect(duplicateFileResponse.statusCode).toBe(409);

        const folderA = await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            overrides: { name: "Alpha" },
        });
        const folderB = await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            overrides: { name: "Beta" },
        });

        const renameConflictResponse = await server.inject({
            method: "PATCH",
            url: `/api/folders/${folderB.id}`,
            headers: authHeader,
            payload: { name: folderA.name },
        });

        expect(renameConflictResponse.statusCode).toBe(409);

        const destinationFolder = await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
        });
        await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            folderId: destinationFolder.id,
            overrides: { name: "dup.pdf" },
        });
        const movingFile = await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            overrides: { name: "dup.pdf" },
        });

        const moveConflictResponse = await server.inject({
            method: "PATCH",
            url: `/api/files/${movingFile.id}`,
            headers: authHeader,
            payload: { folderId: destinationFolder.id },
        });

        expect(moveConflictResponse.statusCode).toBe(409);
    });
});
