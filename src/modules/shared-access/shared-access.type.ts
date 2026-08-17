import { PaginationQuery } from "@/lib/validation/pagination/pagination.schema.js";

export type ViewerIdentity = {
    userId: string;
    userEmail: string;
};

export type PublicEntryPayload = {
    token: string;
    query: PaginationQuery;
};

export type PublicFolderPayload = {
    token: string;
    folderId: string;
    query: PaginationQuery;
};

export type PublicFilePayload = {
    token: string;
    fileId: string;
};

export type ListMySharesPayload = ViewerIdentity & {
    query: PaginationQuery;
};

export type PermissionedDataRoomPayload = ViewerIdentity & {
    dataRoomId: string;
    query: PaginationQuery;
};

export type PermissionedFolderPayload = ViewerIdentity & {
    folderId: string;
    query: PaginationQuery;
};

export type PermissionedFilePayload = ViewerIdentity & {
    fileId: string;
};
