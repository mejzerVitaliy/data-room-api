/**
 * Single source of truth for every message returned to the client.
 * Grouped by module.
 */
export const RESPONSE_MESSAGES = {
    user: {
        notFound: "User not found.",
    },

    auth: {
        registered: "Account created successfully.",
        loggedIn: "Logged in successfully.",
        loggedOut: "Logged out successfully.",
        tokenRefreshed: "Session refreshed successfully.",
        fetched: "Current user fetched successfully.",
        emailTaken: "An account with this email already exists.",
        invalidCredentials: "Invalid email or password.",
        unauthorized: "Authentication required.",
    },
    dataRoom: {
        notFound: "Data Room not found.",
        created: "Data Room created successfully.",
        fetched: "Data Rooms fetched successfully.",
        renamed: "Data Room renamed successfully.",
        deleted: "Data Room deleted successfully.",
        deletePreview: "Delete preview fetched successfully.",
        nameTaken: "A Data Room with this name already exists.",
    },
    folder: {
        notFound: "Folder not found.",
        created: "Folder created successfully.",
        fetched: "Folders fetched successfully.",
        renamed: "Folder renamed successfully.",
        moved: "Folder moved successfully.",
        deleted: "Folder deleted successfully.",
        deletePreview: "Delete preview fetched successfully.",
        nameTaken: "A folder with this name already exists here.",
        invalidParent: "The destination folder is invalid.",
    },
    file: {
        notFound: "File not found.",
        uploadUrlCreated: "Upload URL created successfully.",
        created: "File uploaded successfully.",
        fetched: "Files fetched successfully.",
        renamed: "File renamed successfully.",
        moved: "File moved successfully.",
        deleted: "File deleted successfully.",
        nameTaken: "A file with this name already exists here.",
        invalidFolder: "The destination folder is invalid.",
    },
    share: {
        notFound: "Share not found.",
        fetched: "Sharing settings fetched successfully.",
        publicEnabled: "Public link enabled successfully.",
        publicRevoked: "Public link revoked successfully.",
        granteesUpdated: "Shared users updated successfully.",
        permissionedRevoked: "Access revoked for all shared users.",
        invalidResource: "The shared item is no longer available.",
    },
    shareGrant: {
        notFound: "Share Grant not found.",
    },
} as const;
