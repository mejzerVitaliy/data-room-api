import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import { FastifyInstance } from "fastify";
import { FastifyPlugin } from "@/lib/constants/fastify.constant.js";

const configureCookie = async (fastify: FastifyInstance) => {
    await fastify.register(fastifyCookie);
};

export default fp(configureCookie, {
    name: FastifyPlugin.Cookie,
});
