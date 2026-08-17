-- CreateEnum
CREATE TYPE "public"."ShareResourceType" AS ENUM ('DATA_ROOM', 'FOLDER', 'FILE');

-- CreateEnum
CREATE TYPE "public"."ShareMode" AS ENUM ('PUBLIC', 'PERMISSIONED');

-- CreateEnum
CREATE TYPE "public"."ShareGranteeRole" AS ENUM ('VIEWER');

-- CreateTable
CREATE TABLE "public"."data_rooms" (
    "id" SERIAL NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."folders" (
    "id" SERIAL NOT NULL,
    "data_room_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."files" (
    "id" SERIAL NOT NULL,
    "data_room_id" INTEGER NOT NULL,
    "folder_id" INTEGER,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_key" TEXT NOT NULL,
    "uploaded_by_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shares" (
    "id" SERIAL NOT NULL,
    "resource_type" "public"."ShareResourceType" NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "data_room_id" INTEGER NOT NULL,
    "owner_id" INTEGER NOT NULL,
    "mode" "public"."ShareMode" NOT NULL,
    "public_token" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMP(3),

    CONSTRAINT "shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."share_grants" (
    "id" SERIAL NOT NULL,
    "share_id" INTEGER NOT NULL,
    "grantee_email" TEXT NOT NULL,
    "grantee_user_id" INTEGER,
    "role" "public"."ShareGranteeRole" NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_rooms_owner_id_name_key" ON "public"."data_rooms"("owner_id", "name");

-- CreateIndex
CREATE INDEX "folders_data_room_id_parent_id_idx" ON "public"."folders"("data_room_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "folders_data_room_id_parent_id_name_key" ON "public"."folders"("data_room_id", "parent_id", "name");

-- CreateIndex
CREATE INDEX "files_data_room_id_folder_id_idx" ON "public"."files"("data_room_id", "folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "files_data_room_id_folder_id_name_key" ON "public"."files"("data_room_id", "folder_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "shares_public_token_key" ON "public"."shares"("public_token");

-- CreateIndex
CREATE INDEX "shares_data_room_id_resource_type_resource_id_idx" ON "public"."shares"("data_room_id", "resource_type", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_grants_share_id_grantee_email_key" ON "public"."share_grants"("share_id", "grantee_email");

-- AddForeignKey
ALTER TABLE "public"."data_rooms" ADD CONSTRAINT "data_rooms_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "public"."data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."folders" ADD CONSTRAINT "folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_data_room_id_fkey" FOREIGN KEY ("data_room_id") REFERENCES "public"."data_rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."files" ADD CONSTRAINT "files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shares" ADD CONSTRAINT "shares_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_grants" ADD CONSTRAINT "share_grants_share_id_fkey" FOREIGN KEY ("share_id") REFERENCES "public"."shares"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."share_grants" ADD CONSTRAINT "share_grants_grantee_user_id_fkey" FOREIGN KEY ("grantee_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
