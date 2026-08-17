import { ShareService } from "./share.service.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import {
    ResourceRefInput,
    ResourceRefQuery,
    SetPermissionedGranteesInput,
} from "@/lib/validation/share/share.schema.js";

export type ShareHandler = {
    getSharingState: (
        request: FastifyRequest<{ Querystring: ResourceRefQuery }>,
        reply: FastifyReply
    ) => Promise<void>;

    enablePublicShare: (
        request: FastifyRequest<{ Body: ResourceRefInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    revokePublicShare: (
        request: FastifyRequest<{ Querystring: ResourceRefQuery }>,
        reply: FastifyReply
    ) => Promise<void>;

    setPermissionedGrantees: (
        request: FastifyRequest<{ Body: SetPermissionedGranteesInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    revokePermissionedShare: (
        request: FastifyRequest<{ Querystring: ResourceRefQuery }>,
        reply: FastifyReply
    ) => Promise<void>;
};

export const createHandler = (shareService: ShareService): ShareHandler => {
    return {
        getSharingState: async (request, reply) => {
            const data = await shareService.getSharingState({
                userId: request.user.id,
                query: request.query,
            });

            return reply.send(data);
        },

        enablePublicShare: async (request, reply) => {
            const data = await shareService.enablePublicShare({
                userId: request.user.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        revokePublicShare: async (request, reply) => {
            const data = await shareService.revokePublicShare({
                userId: request.user.id,
                query: request.query,
            });

            return reply.send(data);
        },

        setPermissionedGrantees: async (request, reply) => {
            const data = await shareService.setPermissionedGrantees({
                userId: request.user.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        revokePermissionedShare: async (request, reply) => {
            const data = await shareService.revokePermissionedShare({
                userId: request.user.id,
                query: request.query,
            });

            return reply.send(data);
        },
    };
};

addDIResolverName(createHandler, "shareHandler");
