import { randomBytes } from "node:crypto";

const TOKEN_BYTES = 24;

export const generateShareToken = (): string =>
    randomBytes(TOKEN_BYTES).toString("base64url");
