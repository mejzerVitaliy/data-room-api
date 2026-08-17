import {
    RegisterInput,
    LoginInput,
    AuthResponse,
} from "@/lib/validation/auth/auth.schema.js";

export type RegisterPayload = {
    payload: RegisterInput;
};

export type LoginPayload = {
    payload: LoginInput;
};

export type AuthServiceResult = AuthResponse & {
    accessToken: string;
    refreshToken?: string;
};
