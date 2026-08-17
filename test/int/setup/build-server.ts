import { FastifyInstance } from "fastify";
import { configureServer } from "@/server.js";

export const buildServer = async (): Promise<{
    server: FastifyInstance;
    teardown: () => Promise<void>;
}> => {
    const server = await configureServer();

    return { server, teardown: () => server.close() };
};
