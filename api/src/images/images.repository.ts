import { PrismaService } from "src/prisma/prisma.service";
import { ImageStatus } from "@prisma/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByHashAndSig(hash: string, cropSig: string) {
    return this.prisma.image.findUnique({ where: { hash_cropSig: { hash, cropSig } } });
  }

  async markProcessing(hash: string, cropSig: string) {
    return this.prisma.image.upsert({
      where: { hash_cropSig: { hash, cropSig } },
      create: {
        hash, cropSig, s3Bucket: '', s3Key: '',
        width: 0, height: 0, mime: 'application/octet-stream',
        sizeBytes: BigInt(0), meta: {}, status: ImageStatus.processing,
      },
      update: { status: ImageStatus.processing },
    });
  }

  async upsertReady(input: {
    hash: string; cropSig: string; s3Bucket: string; s3Key: string;
    width: number; height: number; mime: string; sizeBytes: number; meta?: any;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.image.findUnique({
        where: { hash_cropSig: { hash: input.hash, cropSig: input.cropSig } },
        select: { id: true, version: true },
      });

      if (!existing) {
        return tx.image.create({
          data: {
            hash: input.hash, cropSig: input.cropSig,
            s3Bucket: input.s3Bucket, s3Key: input.s3Key,
            width: input.width, height: input.height,
            mime: input.mime, sizeBytes: BigInt(input.sizeBytes),
            meta: input.meta ?? {}, status: ImageStatus.ready, version: 1,
          },
        });
      }

      return tx.image.update({
        where: { id: existing.id },
        data: {
          s3Bucket: input.s3Bucket, s3Key: input.s3Key,
          width: input.width, height: input.height,
          mime: input.mime, sizeBytes: BigInt(input.sizeBytes),
          meta: input.meta ?? {}, status: ImageStatus.ready,
          version: { increment: 1 },
        },
      });
    });
  }

  async getVersion(hash: string, cropSig: string) {
    const r = await this.prisma.image.findUnique({
      where: { hash_cropSig: { hash, cropSig } },
      select: { version: true },
    });
    return r?.version ?? null;
  }
}