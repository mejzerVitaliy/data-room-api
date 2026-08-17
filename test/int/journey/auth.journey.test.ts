import { FastifyInstance } from "fastify";
import { buildServer } from "../setup/build-server.js";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("auth journey", () => {
    let server: FastifyInstance;
    let teardown: () => Promise<void>;

    beforeEach(async () => {
        ({ server, teardown } = await buildServer());
    });

    afterEach(async () => {
        await teardown();
    });

    it("registers, rejects a duplicate email, rejects a wrong password, logs in, refreshes, and logs out", async () => {
        const email = "alice@example.com";

        const registerResponse = await server.inject({
            method: "POST",
            url: "/api/auth/register",
            payload: { email, password: "password123", name: "Alice" },
        });

        expect(registerResponse.statusCode).toBe(200);
        expect(registerResponse.json().data.user).toMatchObject({ email });
        expect(registerResponse.json().data).not.toHaveProperty("accessToken");

        const registerCookies = Object.fromEntries(
            registerResponse.cookies.map(({ name, value }) => [name, value])
        );

        expect(registerCookies).toHaveProperty("data_room_access_token");
        expect(registerCookies).toHaveProperty("data_room_refresh_token");

        const accessCookie = registerResponse.cookies.find(
            ({ name }) => name === "data_room_access_token"
        );

        expect(accessCookie?.httpOnly).toBe(true);

        const duplicateResponse = await server.inject({
            method: "POST",
            url: "/api/auth/register",
            payload: { email, password: "password123", name: "Alice" },
        });

        expect(duplicateResponse.statusCode).toBe(409);

        const wrongPasswordResponse = await server.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: { email, password: "wrong-password" },
        });

        expect(wrongPasswordResponse.statusCode).toBe(401);

        const loginResponse = await server.inject({
            method: "POST",
            url: "/api/auth/login",
            payload: { email, password: "password123" },
        });

        expect(loginResponse.statusCode).toBe(200);

        const loginCookies = Object.fromEntries(
            loginResponse.cookies.map(({ name, value }) => [name, value])
        );

        const meResponse = await server.inject({
            method: "GET",
            url: "/api/auth/me",
            cookies: {
                data_room_access_token: loginCookies.data_room_access_token,
            },
        });

        expect(meResponse.statusCode).toBe(200);
        expect(meResponse.json().data.user).toMatchObject({ email });

        const noAuthResponse = await server.inject({
            method: "GET",
            url: "/api/auth/me",
        });

        expect(noAuthResponse.statusCode).toBe(401);

        const refreshWithoutCookieResponse = await server.inject({
            method: "POST",
            url: "/api/auth/refresh",
        });

        expect(refreshWithoutCookieResponse.statusCode).toBe(401);

        const refreshResponse = await server.inject({
            method: "POST",
            url: "/api/auth/refresh",
            cookies: {
                data_room_refresh_token: loginCookies.data_room_refresh_token,
            },
        });

        expect(refreshResponse.statusCode).toBe(200);

        const newAccessToken = refreshResponse.cookies.find(
            ({ name }) => name === "data_room_access_token"
        )?.value;

        expect(newAccessToken).toBeTruthy();

        const meWithRefreshedTokenResponse = await server.inject({
            method: "GET",
            url: "/api/auth/me",
            cookies: { data_room_access_token: newAccessToken ?? "" },
        });

        expect(meWithRefreshedTokenResponse.statusCode).toBe(200);

        const refreshTokenAsAccessResponse = await server.inject({
            method: "GET",
            url: "/api/auth/me",
            cookies: {
                data_room_access_token: loginCookies.data_room_refresh_token,
            },
        });

        expect(refreshTokenAsAccessResponse.statusCode).toBe(401);

        const logoutResponse = await server.inject({
            method: "POST",
            url: "/api/auth/logout",
        });

        expect(logoutResponse.statusCode).toBe(200);

        const clearedAccessCookie = logoutResponse.cookies.find(
            ({ name }) => name === "data_room_access_token"
        );

        expect(clearedAccessCookie?.value).toBe("");
    });
});
