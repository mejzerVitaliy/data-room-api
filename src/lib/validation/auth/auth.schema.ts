import { z } from "zod";

const MIN_PASSWORD_LENGTH = 8;

const publicUserSchema = z.object({
    id: z.uuid(),
    email: z.string(),
    name: z.string(),
    createdAt: z.date(),
});

const registerBodySchema = z.object({
    email: z.email(),
    password: z.string().min(MIN_PASSWORD_LENGTH),
    name: z.string().min(1),
});

type RegisterInput = z.infer<typeof registerBodySchema>;

const loginBodySchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});

type LoginInput = z.infer<typeof loginBodySchema>;

const authResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        user: publicUserSchema,
    }),
});

type AuthResponse = z.infer<typeof authResponseSchema>;

const meResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        user: publicUserSchema,
    }),
});

type MeResponse = z.infer<typeof meResponseSchema>;

export {
    publicUserSchema,
    registerBodySchema,
    loginBodySchema,
    authResponseSchema,
    meResponseSchema,
};

export type { RegisterInput, LoginInput, AuthResponse, MeResponse };
