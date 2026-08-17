import fp from "fastify-plugin";
import fastifyCors from "@fastify/cors";
import { FastifyInstance } from "fastify";
import { FastifyPlugin } from "@/lib/constants/fastify.constant.js";

const configureCors = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCors, {
        origin: fastify.config.FRONTEND_URL,
        credentials: true,
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    });
};

export default fp(configureCors, {
    dependencies: [FastifyPlugin.Env],
});
