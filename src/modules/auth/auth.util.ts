import { EnvConfig } from "@/types/env.type.js";
import { CookieSerializeOptions } from "@fastify/cookie";
import {
    AUTH_ACCESS_COOKIE_MAX_AGE_SECONDS,
    AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS,
    AUTH_REFRESH_COOKIE_PATH,
} from "./auth.constant.js";

const buildBaseCookieOptions = (config: EnvConfig): CookieSerializeOptions => {
    const isProduction = config.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
    };
};

export const buildAccessCookieOptions = (
    config: EnvConfig
): CookieSerializeOptions => ({
    ...buildBaseCookieOptions(config),
    path: "/",
    maxAge: AUTH_ACCESS_COOKIE_MAX_AGE_SECONDS,
});

export const buildRefreshCookieOptions = (
    config: EnvConfig
): CookieSerializeOptions => ({
    ...buildBaseCookieOptions(config),
    path: AUTH_REFRESH_COOKIE_PATH,
    maxAge: AUTH_REFRESH_COOKIE_MAX_AGE_SECONDS,
});
