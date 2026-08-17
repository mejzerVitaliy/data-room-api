import { AuthService } from "./auth.service.js";
import { EnvConfig } from "@/types/env.type.js";
import { FastifyReply, FastifyRequest } from "fastify";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { UnauthorizedError } from "@/lib/errors/errors.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import {
    RegisterInput,
    LoginInput,
} from "@/lib/validation/auth/auth.schema.js";
import {
    buildAccessCookieOptions,
    buildRefreshCookieOptions,
} from "./auth.util.js";
import {
    AUTH_ACCESS_COOKIE_NAME,
    AUTH_REFRESH_COOKIE_NAME,
    AUTH_REFRESH_COOKIE_PATH,
} from "./auth.constant.js";

export type AuthHandler = {
    register: (
        request: FastifyRequest<{ Body: RegisterInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    login: (
        request: FastifyRequest<{ Body: LoginInput }>,
        reply: FastifyReply
    ) => Promise<void>;

    me: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    refresh: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

    logout: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
};

export const createHandler = (authService: AuthService): AuthHandler => {
    const setAuthCookies = (
        reply: FastifyReply,
        config: EnvConfig,
        tokens: { accessToken: string; refreshToken?: string }
    ) => {
        reply.setCookie(
            AUTH_ACCESS_COOKIE_NAME,
            tokens.accessToken,
            buildAccessCookieOptions(config)
        );

        if (tokens.refreshToken) {
            reply.setCookie(
                AUTH_REFRESH_COOKIE_NAME,
                tokens.refreshToken,
                buildRefreshCookieOptions(config)
            );
        }
    };

    return {
        register: async (request, reply) => {
            const { body } = request;

            const { accessToken, refreshToken, ...response } =
                await authService.register({ payload: body });

            setAuthCookies(reply, request.server.config, {
                accessToken,
                refreshToken,
            });

            return reply.send(response);
        },

        login: async (request, reply) => {
            const { body } = request;

            const { accessToken, refreshToken, ...response } =
                await authService.login({ payload: body });

            setAuthCookies(reply, request.server.config, {
                accessToken,
                refreshToken,
            });

            return reply.send(response);
        },

        me: async (request, reply) => {
            const data = await authService.me(request.user.id);

            return reply.send(data);
        },

        refresh: async (request, reply) => {
            const refreshToken = request.cookies[AUTH_REFRESH_COOKIE_NAME];

            if (!refreshToken) {
                throw new UnauthorizedError(
                    RESPONSE_MESSAGES.auth.unauthorized
                );
            }

            let decoded: { id: string; type: string };

            try {
                decoded = request.server.jwt.verify(refreshToken);
            } catch {
                throw new UnauthorizedError(
                    RESPONSE_MESSAGES.auth.unauthorized
                );
            }

            if (decoded.type !== "refresh") {
                throw new UnauthorizedError(
                    RESPONSE_MESSAGES.auth.unauthorized
                );
            }

            const { accessToken, ...response } = await authService.refresh(
                decoded.id
            );

            setAuthCookies(reply, request.server.config, { accessToken });

            return reply.send(response);
        },

        logout: async (_request, reply) => {
            reply.clearCookie(AUTH_ACCESS_COOKIE_NAME, { path: "/" });

            reply.clearCookie(AUTH_REFRESH_COOKIE_NAME, {
                path: AUTH_REFRESH_COOKIE_PATH,
            });

            return reply.send({ message: RESPONSE_MESSAGES.auth.loggedOut });
        },
    };
};

addDIResolverName(createHandler, "authHandler");
