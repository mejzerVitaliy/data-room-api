import { z } from "zod";

const messageResponseSchema = z.object({
    message: z.string(),
});

type MessageResponse = z.infer<typeof messageResponseSchema>;

const deletePreviewResponseSchema = z.object({
    message: z.string(),
    data: z.object({
        folderCount: z.number(),
        fileCount: z.number(),
        totalSizeBytes: z.number(),
    }),
});

type DeletePreviewResponse = z.infer<typeof deletePreviewResponseSchema>;

export { messageResponseSchema, deletePreviewResponseSchema };
export type { MessageResponse, DeletePreviewResponse };
