import { JWT } from "@fastify/jwt";
import { Prisma } from "@prisma/client";
import { hashing } from "@/lib/hashing/hashing.js";
import { addDIResolverName } from "@/lib/awilix/awilix.js";
import { MeResponse } from "@/lib/validation/auth/auth.schema.js";
import { RESPONSE_MESSAGES } from "@/lib/messages/messages.constant.js";
import { ConflictError, UnauthorizedError } from "@/lib/errors/errors.js";
import { UserRepository } from "@/database/repositories/user/user.repository.js";
import { PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE } from "@/lib/constants/prisma.constant.js";
import {
    AUTH_ACCESS_TOKEN_TTL,
    AUTH_REFRESH_TOKEN_TTL,
} from "./auth.constant.js";
import {
    RegisterPayload,
    LoginPayload,
    AuthServiceResult,
} from "./auth.type.js";

const PUBLIC_USER_SELECT = {
    id: true,
    email: true,
    name: true,
    createdAt: true,
} as const;

export type AuthService = {
    register: (payload: RegisterPayload) => Promise<AuthServiceResult>;
    login: (payload: LoginPayload) => Promise<AuthServiceResult>;
    me: (userId: string) => Promise<MeResponse>;
    refresh: (userId: string) => Promise<AuthServiceResult>;
};

export const createService = (
    userRepository: UserRepository,
    jwt: JWT
): AuthService => {
    const issueTokens = (user: { id: string; email: string }) => ({
        accessToken: jwt.sign(
            { id: user.id, email: user.email, type: "access" },
            { expiresIn: AUTH_ACCESS_TOKEN_TTL }
        ),
        refreshToken: jwt.sign(
            { id: user.id, email: user.email, type: "refresh" },
            { expiresIn: AUTH_REFRESH_TOKEN_TTL }
        ),
    });

    return {
        register: async ({ payload }) => {
            const { email, password, name } = payload;

            const existingUser = await userRepository.findUnique({
                where: { email },
            });

            if (existingUser) {
                throw new ConflictError(RESPONSE_MESSAGES.auth.emailTaken);
            }

            const passwordHash = await hashing.hashPassword(password);

            const user = await userRepository
                .create({
                    data: { email, passwordHash, name },
                    select: PUBLIC_USER_SELECT,
                })
                .catch((error: unknown) => {
                    if (
                        error instanceof Prisma.PrismaClientKnownRequestError &&
                        error.code === PRISMA_UNIQUE_CONSTRAINT_ERROR_CODE
                    ) {
                        throw new ConflictError(
                            RESPONSE_MESSAGES.auth.emailTaken
                        );
                    }

                    throw error;
                });

            const { accessToken, refreshToken } = issueTokens(user);

            return {
                message: RESPONSE_MESSAGES.auth.registered,
                data: { user },
                accessToken,
                refreshToken,
            };
        },

        login: async ({ payload }) => {
            const { email, password } = payload;

            const user = await userRepository.findUnique({
                where: { email },
                select: { ...PUBLIC_USER_SELECT, passwordHash: true },
            });

            if (!user) {
                throw new UnauthorizedError(
                    RESPONSE_MESSAGES.auth.invalidCredentials
                );
            }

            const isPasswordValid = await hashing.comparePassword({
                password,
                hash: user.passwordHash,
            });

            if (!isPasswordValid) {
                throw new UnauthorizedError(
                    RESPONSE_MESSAGES.auth.invalidCredentials
                );
            }

            const publicUser = {
                id: user.id,
                email: user.email,
                name: user.name,
                createdAt: user.createdAt,
            };

            const { accessToken, refreshToken } = issueTokens(publicUser);

            return {
                message: RESPONSE_MESSAGES.auth.loggedIn,
                data: { user: publicUser },
                accessToken,
                refreshToken,
            };
        },

        me: async (userId) => {
            const user = await userRepository.findUniqueOrFail({
                where: { id: userId },
                select: PUBLIC_USER_SELECT,
            });

            return {
                message: RESPONSE_MESSAGES.auth.fetched,
                data: { user },
            };
        },

        refresh: async (userId) => {
            const user = await userRepository.findUniqueOrFail({
                where: { id: userId },
                select: PUBLIC_USER_SELECT,
            });

            const { accessToken } = issueTokens(user);

            return {
                message: RESPONSE_MESSAGES.auth.tokenRefreshed,
                data: { user },
                accessToken,
            };
        },
    };
};

addDIResolverName(createService, "authService");
