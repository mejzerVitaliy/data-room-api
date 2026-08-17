import {
    ListFoldersQuery,
    CreateFolderInput,
    UpdateFolderInput,
} from "@/lib/validation/folder/folder.schema.js";

export type ListFoldersPayload = {
    userId: string;
    query: ListFoldersQuery;
};

export type CreateFolderPayload = {
    userId: string;
    payload: CreateFolderInput;
};

export type GetFolderPayload = {
    userId: string;
    folderId: string;
};

export type UpdateFolderPayload = {
    userId: string;
    folderId: string;
    payload: UpdateFolderInput;
};

export type DeleteFolderPayload = {
    userId: string;
    folderId: string;
};
