import { z } from "zod";

const MAX_GRANTEES = 50;

const shareResourceTypeSchema = z.enum(["DATA_ROOM", "FOLDER", "FILE"]);

const resourceRefBodySchema = z.object({
    resourceType: shareResourceTypeSchema,
    resourceId: z.uuid(),
});

const resourceRefQuerySchema = z.object({
    resourceType: shareResourceTypeSchema,
    resourceId: z.uuid(),
});

const granteeSchema = z.object({
    id: z.uuid(),
    email: z.string(),
    createdAt: z.date(),
});

const publicShareSchema = z.object({
    id: z.uuid(),
    token: z.string(),
    createdAt: z.date(),
});

const permissionedShareSchema = z.object({
    id: z.uuid(),
    grantees: z.array(granteeSchema),
});

const sharingStateResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        publicShare: publicShareSchema.nullable(),
        permissionedShare: permissionedShareSchema.nullable(),
    }),
});

type SharingStateResponse = z.infer<typeof sharingStateResponseSchema>;

const publicShareResponseSchema = z.object({
    message: z.string(),
    data: z.object({ publicShare: publicShareSchema }),
});

type PublicShareResponse = z.infer<typeof publicShareResponseSchema>;

const setPermissionedGranteesBodySchema = resourceRefBodySchema.extend({
    granteeEmails: z.array(z.email()).max(MAX_GRANTEES),
});

type SetPermissionedGranteesInput = z.infer<
    typeof setPermissionedGranteesBodySchema
>;

const permissionedShareResponseSchema = z.object({
    message: z.string(),
    data: z.object({ permissionedShare: permissionedShareSchema }),
});

type PermissionedShareResponse = z.infer<
    typeof permissionedShareResponseSchema
>;

type ResourceRefInput = z.infer<typeof resourceRefBodySchema>;
type ResourceRefQuery = z.infer<typeof resourceRefQuerySchema>;

export {
    shareResourceTypeSchema,
    resourceRefBodySchema,
    resourceRefQuerySchema,
    sharingStateResponseSchema,
    publicShareResponseSchema,
    setPermissionedGranteesBodySchema,
    permissionedShareResponseSchema,
};

export type {
    ResourceRefInput,
    ResourceRefQuery,
    SharingStateResponse,
    PublicShareResponse,
    SetPermissionedGranteesInput,
    PermissionedShareResponse,
};
