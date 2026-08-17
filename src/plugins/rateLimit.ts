import fp from "fastify-plugin";
import fastifyRateLimit from "@fastify/rate-limit";
import { FastifyInstance } from "fastify";

const GLOBAL_RATE_LIMIT_MAX = 300;
const RATE_LIMIT_TIME_WINDOW = "1 minute";

const configureRateLimit = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyRateLimit, {
        max: GLOBAL_RATE_LIMIT_MAX,
        timeWindow: RATE_LIMIT_TIME_WINDOW,
    });
};

export default fp(configureRateLimit, {});
