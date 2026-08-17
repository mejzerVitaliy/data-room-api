import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest } from "fastify";
import { UnauthorizedError } from "@/lib/errors/errors.js";
import { FastifyPlugin } from "@/lib/constants/fastify.constant.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";

const configureAuthenticate = async (fastify: FastifyInstance) => {
    fastify.decorate("authenticate", async (request: FastifyRequest) => {
        try {
            await request.jwtVerify();
        } catch {
            throw new UnauthorizedError(RESPONSE_MESSAGES.auth.unauthorized);
        }

        if (request.user.type !== "access") {
            throw new UnauthorizedError(RESPONSE_MESSAGES.auth.unauthorized);
        }
    });
};

export default fp(configureAuthenticate, {
    name: FastifyPlugin.Authenticate,
    dependencies: [FastifyPlugin.Jwt],
});
