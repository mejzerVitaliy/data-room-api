import { FastifyReply, FastifyRequest } from "fastify";
import { DataRoomService } from "./data-room.service.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { PaginationQuery } from "@/lib/validation/pagination/pagination.schema.js";
import {
    DataRoomParams,
    CreateDataRoomInput,
    UpdateDataRoomInput,
} from "@/lib/validation/data-room/data-room.schema.js";

export type DataRoomHandler = {
    create: (
        request: FastifyRequest<{ Body: CreateDataRoomInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    list: (
        request: FastifyRequest<{ Querystring: PaginationQuery }>,
        reply: FastifyReply
    ) => Promise<void>;

    getOne: (
        request: FastifyRequest<{ Params: DataRoomParams }>,
        reply: FastifyReply
    ) => Promise<void>;

    update: (
        request: FastifyRequest<{
            Params: DataRoomParams;
            Body: UpdateDataRoomInput;
        }>,
        reply: FastifyReply
    ) => Promise<void>;

    remove: (
        request: FastifyRequest<{ Params: DataRoomParams }>,
        reply: FastifyReply
    ) => Promise<void>;

    getDeletePreview: (
        request: FastifyRequest<{ Params: DataRoomParams }>,
        reply: FastifyReply
    ) => Promise<void>;
};

export const createHandler = (
    dataRoomService: DataRoomService
): DataRoomHandler => {
    return {
        create: async (request, reply) => {
            const data = await dataRoomService.create({
                userId: request.user.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        list: async (request, reply) => {
            const data = await dataRoomService.list({
                userId: request.user.id,
                query: request.query,
            });

            return reply.send(data);
        },

        getOne: async (request, reply) => {
            const data = await dataRoomService.getOne({
                userId: request.user.id,
                dataRoomId: request.params.id,
            });

            return reply.send(data);
        },

        update: async (request, reply) => {
            const data = await dataRoomService.update({
                userId: request.user.id,
                dataRoomId: request.params.id,
                payload: request.body,
            });

            return reply.send(data);
        },

        remove: async (request, reply) => {
            const data = await dataRoomService.remove({
                userId: request.user.id,
                dataRoomId: request.params.id,
            });

            return reply.send(data);
        },

        getDeletePreview: async (request, reply) => {
            const data = await dataRoomService.getDeletePreview({
                userId: request.user.id,
                dataRoomId: request.params.id,
            });

            return reply.send(data);
        },
    };
};

addDIResolverName(createHandler, "dataRoomHandler");
