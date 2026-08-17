export type EnvConfig = {
    NODE_ENV: "development" | "production" | "test";
    HOST: string;
    DATABASE_URL: string;
    PORT: number;
    APPLICATION_SECRET: string;
    APPLICATION_URL: string;
    FRONTEND_URL: string;
    DOCS_PASSWORD: string | undefined;
    AWS_REGION: string | undefined;
    AWS_ACCESS_KEY_ID: string | undefined;
    AWS_SECRET_ACCESS_KEY: string | undefined;
    AWS_S3_BUCKET_NAME: string | undefined;
    AWS_S3_ENDPOINT: string | undefined;
};
