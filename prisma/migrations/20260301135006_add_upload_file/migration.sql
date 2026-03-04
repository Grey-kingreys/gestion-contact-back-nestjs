-- AlterTable
ALTER TABLE "public"."chat_messages" ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "fileUrl" TEXT;

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "avatarUrl" TEXT;
