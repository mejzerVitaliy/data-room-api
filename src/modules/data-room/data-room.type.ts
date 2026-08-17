import { PaginationQuery } from "@/lib/validation/pagination/pagination.schema.js";
import {
    CreateDataRoomInput,
    UpdateDataRoomInput,
} from "@/lib/validation/data-room/data-room.schema.js";

export type CreateDataRoomPayload = {
    userId: string;
    payload: CreateDataRoomInput;
};

export type ListDataRoomsPayload = {
    userId: string;
    query: PaginationQuery;
};

export type GetDataRoomPayload = {
    userId: string;
    dataRoomId: string;
};

export type UpdateDataRoomPayload = {
    userId: string;
    dataRoomId: string;
    payload: UpdateDataRoomInput;
};

export type DeleteDataRoomPayload = {
    userId: string;
    dataRoomId: string;
};
