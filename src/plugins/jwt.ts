import fp from "fastify-plugin";
import fastifyJWT from "@fastify/jwt";
import { FastifyInstance } from "fastify";
import { FastifyPlugin } from "@/lib/constants/fastify.constant.js";
import { AUTH_ACCESS_COOKIE_NAME } from "@/modules/auth/auth.constant.js";

const configureJwt = async (fastify: FastifyInstance) => {
    fastify.register(fastifyJWT, {
        secret: fastify.config.APPLICATION_SECRET,
        cookie: {
            cookieName: AUTH_ACCESS_COOKIE_NAME,
            signed: false,
        },
    });
};

export default fp(configureJwt, {
    name: FastifyPlugin.Jwt,
    dependencies: [FastifyPlugin.Env, FastifyPlugin.Cookie],
});
