import { FastifyInstance } from "fastify";
import { ShareHandler } from "./share.handler.js";
import { messageResponseSchema } from "@/lib/validation/common/common.schema.js";
import {
    resourceRefBodySchema,
    resourceRefQuerySchema,
    sharingStateResponseSchema,
    publicShareResponseSchema,
    setPermissionedGranteesBodySchema,
    permissionedShareResponseSchema,
} from "@/lib/validation/share/share.schema.js";

const SHARE_TAG = "share";

enum ShareRoute {
    Root = "/",
    Public = "/public",
    Permissioned = "/permissioned",
}

export const createShareRoutes = (
    fastify: FastifyInstance,
    shareHandler: ShareHandler
) => {
    fastify.addHook("preHandler", fastify.authenticate);

    fastify.get(
        ShareRoute.Root,
        {
            schema: {
                tags: [SHARE_TAG],
                summary: "Get the sharing state of a resource",
                querystring: resourceRefQuerySchema,
                response: { 200: sharingStateResponseSchema },
            },
        },
        shareHandler.getSharingState
    );

    fastify.put(
        ShareRoute.Public,
        {
            schema: {
                tags: [SHARE_TAG],
                summary: "Enable a public link for a resource",
                body: resourceRefBodySchema,
                response: { 200: publicShareResponseSchema },
            },
        },
        shareHandler.enablePublicShare
    );

    fastify.delete(
        ShareRoute.Public,
        {
            schema: {
                tags: [SHARE_TAG],
                summary: "Revoke the public link for a resource",
                querystring: resourceRefQuerySchema,
                response: { 200: messageResponseSchema },
            },
        },
        shareHandler.revokePublicShare
    );

    fastify.put(
        ShareRoute.Permissioned,
        {
            schema: {
                tags: [SHARE_TAG],
                summary: "Set the list of users granted access to a resource",
                body: setPermissionedGranteesBodySchema,
                response: { 200: permissionedShareResponseSchema },
            },
        },
        shareHandler.setPermissionedGrantees
    );

    fastify.delete(
        ShareRoute.Permissioned,
        {
            schema: {
                tags: [SHARE_TAG],
                summary: "Revoke all permissioned access to a resource",
                querystring: resourceRefQuerySchema,
                response: { 200: messageResponseSchema },
            },
        },
        shareHandler.revokePermissionedShare
    );
};
