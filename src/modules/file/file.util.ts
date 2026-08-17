import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { FileTypeFilter } from "@/lib/validation/file/file.schema.js";

const UNSAFE_KEY_CHARS = /[^a-zA-Z0-9._-]/g;

export const buildStorageKey = (params: {
    dataRoomId: string;
    fileName: string;
}): string => {
    const { dataRoomId, fileName } = params;
    const sanitizedFileName = fileName.replace(UNSAFE_KEY_CHARS, "-");

    return `data-rooms/${dataRoomId}/${randomUUID()}-${sanitizedFileName}`;
};

const KNOWN_MIME_TYPE_FILTERS: Record<
    Exclude<FileTypeFilter, "other">,
    Prisma.StringFilter<"File">
> = {
    pdf: { equals: "application/pdf" },
    image: { startsWith: "image/" },
    document: {
        in: [
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/rtf",
            "text/plain",
        ],
    },
    spreadsheet: {
        in: [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "text/csv",
        ],
    },
};

export const buildFileTypeWhere = (
    fileType: FileTypeFilter | undefined
): Pick<Prisma.FileWhereInput, "mimeType" | "AND"> => {
    if (!fileType) {
        return {};
    }

    if (fileType === "other") {
        return {
            AND: Object.values(KNOWN_MIME_TYPE_FILTERS).map((filter) => ({
                NOT: { mimeType: filter },
            })),
        };
    }

    return { mimeType: KNOWN_MIME_TYPE_FILTERS[fileType] };
};

const INLINE_PREVIEWABLE_MIME_TYPES = new Set([
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
]);

// Anything outside the small set of formats we know browsers render safely
// (PDF, raster images) is served with Content-Disposition: attachment, so it
// downloads instead of being interpreted inline by the browser.
export const buildViewDisposition = (
    mimeType: string
): "inline" | "attachment" =>
    INLINE_PREVIEWABLE_MIME_TYPES.has(mimeType) ? "inline" : "attachment";
