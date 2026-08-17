import {
    ListFilesQuery,
    UpdateFileInput,
    CompleteUploadInput,
    CreateUploadUrlInput,
} from "@/lib/validation/file/file.schema.js";

export type CreateUploadUrlPayload = {
    userId: string;
    payload: CreateUploadUrlInput;
};

export type CompleteUploadPayload = {
    userId: string;
    payload: CompleteUploadInput;
};

export type ListFilesPayload = {
    userId: string;
    query: ListFilesQuery;
};

export type GetFilePayload = {
    userId: string;
    fileId: string;
};

export type UpdateFilePayload = {
    userId: string;
    fileId: string;
    payload: UpdateFileInput;
};

export type DeleteFilePayload = {
    userId: string;
    fileId: string;
};
