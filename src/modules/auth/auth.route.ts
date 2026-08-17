import { FastifyInstance } from "fastify";
import { AuthHandler } from "./auth.handler.js";
import { messageResponseSchema } from "@/lib/validation/common/common.schema.js";
import {
    loginBodySchema,
    authResponseSchema,
    meResponseSchema,
    registerBodySchema,
} from "@/lib/validation/auth/auth.schema.js";

const AUTH_TAG = "auth";

const AUTH_RATE_LIMIT_MAX = 10;
const AUTH_RATE_LIMIT_TIME_WINDOW = "1 minute";

const authRateLimitConfig = {
    rateLimit: {
        max: AUTH_RATE_LIMIT_MAX,
        timeWindow: AUTH_RATE_LIMIT_TIME_WINDOW,
    },
};

enum AuthRoute {
    Register = "/register",
    Login = "/login",
    Me = "/me",
    Refresh = "/refresh",
    Logout = "/logout",
}

export const createAuthRoutes = (
    fastify: FastifyInstance,
    authHandler: AuthHandler
) => {
    fastify.post(
        AuthRoute.Register,
        {
            config: authRateLimitConfig,
            schema: {
                tags: [AUTH_TAG],
                summary: "Register a new account",
                body: registerBodySchema,
                response: { 200: authResponseSchema },
            },
        },
        authHandler.register
    );

    fastify.post(
        AuthRoute.Login,
        {
            config: authRateLimitConfig,
            schema: {
                tags: [AUTH_TAG],
                summary: "Log in with email and password",
                body: loginBodySchema,
                response: { 200: authResponseSchema },
            },
        },
        authHandler.login
    );

    fastify.get(
        AuthRoute.Me,
        {
            preHandler: [fastify.authenticate],
            schema: {
                tags: [AUTH_TAG],
                summary: "Fetch the current authenticated user",
                response: { 200: meResponseSchema },
            },
        },
        authHandler.me
    );

    fastify.post(
        AuthRoute.Refresh,
        {
            config: authRateLimitConfig,
            schema: {
                tags: [AUTH_TAG],
                summary:
                    "Exchange the refresh token cookie for a new access token",
                response: { 200: authResponseSchema },
            },
        },
        authHandler.refresh
    );

    fastify.post(
        AuthRoute.Logout,
        {
            schema: {
                tags: [AUTH_TAG],
                summary: "Clear the authentication cookies",
                response: { 200: messageResponseSchema },
            },
        },
        authHandler.logout
    );
};
