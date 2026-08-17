/*
  Warnings:

  - The primary key for the `data_rooms` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `data_rooms` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `files` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `files` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `folder_id` column on the `files` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `folders` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `folders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `parent_id` column on the `folders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `share_grants` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `share_grants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `grantee_user_id` column on the `share_grants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `shares` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `shares` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `owner_id` on the `data_rooms` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `data_room_id` on the `files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `uploaded_by_id` on the `files` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `data_room_id` on the `folders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `share_id` on the `share_grants` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `resource_id` on the `shares` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `data_room_id` on the `shares` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `owner_id` on the `shares` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."data_rooms" DROP CONSTRAINT "data_rooms_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."files" DROP CONSTRAINT "files_data_room_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."files" DROP CONSTRAINT "files_folder_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."files" DROP CONSTRAINT "files_uploaded_by_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."folders" DROP CONSTRAINT "folders_data_room_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."folders" DROP CONSTRAINT "folders_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."share_grants" DROP CONSTRAINT "share_grants_grantee_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."share_grants" DROP CONSTRAINT "share_grants_share_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shares" DROP CONSTRAINT "shares_owner_id_fkey";

-- AlterTable
ALTER TABLE "public"."data_rooms" DROP CONSTRAINT "data_rooms_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "owner_id",
ADD COLUMN     "owner_id" UUID NOT NULL,
ADD CONSTRAINT "data_rooms_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."files" DROP CONSTRAINT "files_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "data_room_id",
ADD COLUMN     "data_room_id" UUID NOT NULL,
DROP COLUMN "folder_id",
ADD COLUMN     "folder_id" UUID,
DROP COLUMN "uploaded_by_id",
ADD COLUMN     "uploaded_by_id" UUID NOT NULL,
ADD CONSTRAINT "files_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."folders" DROP CONSTRAINT "folders_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "data_room_id",
ADD COLUMN     "data_room_id" UUID NOT NULL,
DROP COLUMN "parent_id",
ADD COLUMN     "parent_id" UUID,
ADD CONSTRAINT "folders_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."share_grants" DROP CONSTRAINT "share_grants_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "share_id",
ADD COLUMN     "share_id" UUID NOT NULL,
DROP COLUMN "grantee_user_id",
ADD COLUMN     "grantee_user_id" UUID,
ADD CONSTRAINT "share_grants_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."shares" DROP CONSTRAINT "shares_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
DROP COLUMN "resource_id",
ADD COLUMN     "resource_id" UUID NOT NULL,
DROP COLUMN "data_room_id",
ADD COLUMN     "data_room_id" UUID NOT NULL,
DROP COLUMN "owner_id",
ADD COLUMN     "owner_id" UUID NOT NULL,
ADD CONSTRAINT "shares_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "data_rooms_owner_id_name_key" ON "public"."data_rooms"("owner_id", "name");

-- CreateIndex
CREATE INDEX "files_data_room_id_folder_id_idx" ON "public"."files"("data_room_id", "folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "files_data_room_id_folder_id_name_key" ON "public"."files"("data_room_id", "folder_id", "name");

-- CreateIndex
CREATE INDEX "folders_data_room_id_parent_id_idx" ON "public"."folders"("data_room_id", "parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "folders_data_room_id_parent_id_name_key" ON "public"."folders"("data_room_id", "parent_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "share_grants_share_id_grantee_email_key" ON "public"."share_grants"("share_id", "grantee_email");

-- CreateIndex
CREATE INDEX "shares_data_room_id_resource_type_resource_id_idx" ON "public"."shares"("data_room_id", "resource_type", "resource_id");

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
