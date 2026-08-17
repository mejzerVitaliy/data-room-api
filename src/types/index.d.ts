import { AwilixContainer } from "awilix";
import { EnvConfig } from "./env.type.js";
import { S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { Cradle } from "./di-container.type.js";
import { FastifyReply, FastifyRequest } from "fastify";

declare module "fastify" {
    export interface FastifyInstance {
        config: EnvConfig;
        prisma: PrismaClient;
        di: AwilixContainer<Cradle>;
        awsS3Client: S3Client;
        authenticate: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;
    }
}

declare module "@fastify/jwt" {
    export interface FastifyJWT {
        payload: { id: string; email: string; type: "access" | "refresh" };
        user: { id: string; email: string; type: "access" | "refresh" };
    }
}
