import { FastifyInstance } from "fastify";
import { createUser } from "../factories/user.factory.js";
import { createFile } from "../factories/file.factory.js";
import { buildServer } from "../setup/build-server.js";
import { createFolder } from "../factories/folder.factory.js";
import { createDataRoom } from "../factories/data-room.factory.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("sharing journey", () => {
    let server: FastifyInstance;
    let teardown: () => Promise<void>;

    beforeEach(async () => {
        ({ server, teardown } = await buildServer());
    });

    afterEach(async () => {
        await teardown();
    });

    it("scopes a public folder share to its subtree and revokes access immediately", async () => {
        const owner = await createUser({ prisma: server.prisma });
        const dataRoom = await createDataRoom({
            prisma: server.prisma,
            ownerId: owner.id,
        });
        const sharedFolder = await createFolder({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            overrides: { name: "Secret" },
        });
        const insideFile = await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            folderId: sharedFolder.id,
            overrides: { name: "inside.pdf" },
        });
        const outsideFile = await createFile({
            prisma: server.prisma,
            dataRoomId: dataRoom.id,
            uploadedById: owner.id,
            overrides: { name: "outside.pdf" },
        });

        const ownerToken = server.jwt.sign({
            id: owner.id,
            email: owner.email,
            type: "access",
        });
        const ownerHeader = { authorization: `Bearer ${ownerToken}` };

        const enableResponse = await server.inject({
            method: "PUT",
            url: "/api/shares/public",
            headers: ownerHeader,
            payload: { resourceType: "FOLDER", resourceId: sharedFolder.id },
        });

        expect(enableResponse.statusCode).toBe(200);
        const { token } = enableResponse.json().data.publicShare;

        const insideResponse = await server.inject({
            method: "GET",
            url: `/api/shared/public/${token}/files/${insideFile.id}`,
        });

        expect(insideResponse.statusCode).toBe(200);
        expect(insideResponse.json().data.file.name).toBe("inside.pdf");

        const outsideResponse = await server.inject({
            method: "GET",
            url: `/api/shared/public/${token}/files/${outsideFile.id}`,
        });

        expect(outsideResponse.statusCode).toBe(404);

        const revokeResponse = await server.inject({
            method: "DELETE",
            url: `/api/shares/public?resourceType=FOLDER&resourceId=${sharedFolder.id}`,
            headers: ownerHeader,
        });

        expect(revokeResponse.statusCode).toBe(200);

        const afterRevokeResponse = await server.inject({
            method: "GET",
            url: `/api/shared/public/${token}/files/${insideFile.id}`,
        });

        expect(afterRevokeResponse.statusCode).toBe(404);
    });

    it("grants access only to listed grantees and revokes it for everyone at once", async () => {
        const owner = await createUser({ prisma: server.prisma });
        const grantee = await createUser({
            prisma: server.prisma,
            overrides: { email: "grantee@example.com" },
        });
        const stranger = await createUser({
            prisma: server.prisma,
            overrides: { email: "stranger@example.com" },
        });
        const dataRoom = await createDataRoom({
            prisma: server.prisma,
            ownerId: owner.id,
        });

        const ownerToken = server.jwt.sign({
            id: owner.id,
            email: owner.email,
            type: "access",
        });
        const granteeToken = server.jwt.sign({
            id: grantee.id,
            email: grantee.email,
            type: "access",
        });
        const strangerToken = server.jwt.sign({
            id: stranger.id,
            email: stranger.email,
            type: "access",
        });

        const grantResponse = await server.inject({
            method: "PUT",
            url: "/api/shares/permissioned",
            headers: { authorization: `Bearer ${ownerToken}` },
            payload: {
                resourceType: "DATA_ROOM",
                resourceId: dataRoom.id,
                granteeEmails: [grantee.email],
            },
        });

        expect(grantResponse.statusCode).toBe(200);

        const granteeAccessResponse = await server.inject({
            method: "GET",
            url: `/api/shared/with-me/data-rooms/${dataRoom.id}`,
            headers: { authorization: `Bearer ${granteeToken}` },
        });

        expect(granteeAccessResponse.statusCode).toBe(200);

        const strangerAccessResponse = await server.inject({
            method: "GET",
            url: `/api/shared/with-me/data-rooms/${dataRoom.id}`,
            headers: { authorization: `Bearer ${strangerToken}` },
        });

        expect(strangerAccessResponse.statusCode).toBe(404);

        const revokeResponse = await server.inject({
            method: "DELETE",
            url: `/api/shares/permissioned?resourceType=DATA_ROOM&resourceId=${dataRoom.id}`,
            headers: { authorization: `Bearer ${ownerToken}` },
        });

        expect(revokeResponse.statusCode).toBe(200);

        const afterRevokeResponse = await server.inject({
            method: "GET",
            url: `/api/shared/with-me/data-rooms/${dataRoom.id}`,
            headers: { authorization: `Bearer ${granteeToken}` },
        });

        expect(afterRevokeResponse.statusCode).toBe(404);
    });
});
