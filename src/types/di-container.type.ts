import { JWT } from "@fastify/jwt";
import { EnvConfig } from "./env.type.js";
import { FastifyBaseLogger } from "fastify";
import { S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";
import { FileService } from "@/modules/file/file.service.js";
import { FileHandler } from "@/modules/file/file.handler.js";
import { AuthService } from "@/modules/auth/auth.service.js";
import { AuthHandler } from "@/modules/auth/auth.handler.js";
import { ShareService } from "@/modules/share/share.service.js";
import { ShareHandler } from "@/modules/share/share.handler.js";
import { FolderService } from "@/modules/folder/folder.service.js";
import { FolderHandler } from "@/modules/folder/folder.handler.js";
import { S3BucketService } from "@/lib/s3Bucket/s3Bucket.service.js";
import { DataRoomService } from "@/modules/data-room/data-room.service.js";
import { DataRoomHandler } from "@/modules/data-room/data-room.handler.js";
import { FileRepository } from "@/database/repositories/file/file.repository.js";
import { UserRepository } from "@/database/repositories/user/user.repository.js";
import { ApplicationService } from "@/modules/application/application.service.js";
import { ApplicationHandler } from "@/modules/application/application.handler.js";
import { ShareRepository } from "@/database/repositories/share/share.repository.js";
import { SharedAccessService } from "@/modules/shared-access/shared-access.service.js";
import { SharedAccessHandler } from "@/modules/shared-access/shared-access.handler.js";
import { FolderRepository } from "@/database/repositories/folder/folder.repository.js";
import { DataRoomRepository } from "@/database/repositories/data-room/data-room.repository.js";
import { ShareGrantRepository } from "@/database/repositories/share-grant/share-grant.repository.js";

export type Cradle = {
    log: FastifyBaseLogger;
    prisma: PrismaClient;
    config: EnvConfig;

    shareGrantRepository: ShareGrantRepository;

    sharedAccessService: SharedAccessService;
    sharedAccessHandler: SharedAccessHandler;

    shareRepository: ShareRepository;

    shareService: ShareService;
    shareHandler: ShareHandler;

    fileRepository: FileRepository;

    fileService: FileService;
    fileHandler: FileHandler;

    folderRepository: FolderRepository;

    folderService: FolderService;
    folderHandler: FolderHandler;

    dataRoomRepository: DataRoomRepository;

    dataRoomService: DataRoomService;
    dataRoomHandler: DataRoomHandler;
    jwt: JWT;

    userRepository: UserRepository;

    authService: AuthService;
    authHandler: AuthHandler;
    awsS3Client: S3Client;

    applicationService: ApplicationService;
    applicationHandler: ApplicationHandler;

    s3BucketService: S3BucketService;
};
