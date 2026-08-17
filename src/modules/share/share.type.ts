import {
    ResourceRefInput,
    ResourceRefQuery,
    SetPermissionedGranteesInput,
} from "@/lib/validation/share/share.schema.js";

export type GetSharingStatePayload = {
    userId: string;
    query: ResourceRefQuery;
};

export type EnablePublicSharePayload = {
    userId: string;
    payload: ResourceRefInput;
};

export type RevokePublicSharePayload = {
    userId: string;
    query: ResourceRefQuery;
};

export type SetPermissionedGranteesPayload = {
    userId: string;
    payload: SetPermissionedGranteesInput;
};

export type RevokePermissionedSharePayload = {
    userId: string;
    query: ResourceRefQuery;
};
