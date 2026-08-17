export type DeleteFilePayload = {
    key: string;
};

export type DeleteFilesPayload = {
    keys: string[];
};

export type DeleteFolderPayload = {
    prefix: string;
};

export type CreateUploadSignedUrlPayload = {
    key: string;
    contentType: string;
};

export type CreateReadSignedUrlPayload = {
    key: string;
    responseContentDisposition?: "inline" | "attachment";
};
