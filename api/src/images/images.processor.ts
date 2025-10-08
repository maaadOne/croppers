import sharp from 'sharp';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MinioService } from '../storage/minio.service';
import { RedisCacheService } from '../redis/redis-cache.service';


// для возврата корректного MIME-типа
function contentType(fmt: 'webp' | 'jpeg') {
    return fmt === 'webp' ? 'image/webp' : 'image/jpeg';
}

@Injectable()
export class ImagesProcessor {
    constructor(
        private readonly prisma: PrismaService,
        private readonly storage: MinioService,
        private readonly cache: RedisCacheService
    ) {}
  /**
  * Полный процесс обработки изображения:
  * вход - файл 
  * - (параметры обрезки/качества/формата + идентификатор кэша(hash, sig), опционально ключ блокировки)
  * - нормализация, обрезка, сжатие
  * - загрузку в хранилище
  * - обновление в БД
  * - обновление в кэше
  */
  async process(opts: {
    hash: string;
    sig: string;
    fileBuffer: Buffer;
    crop: { 
      x: number; 
      y: number; 
      w: number; 
      h: number; 
      quality?: number; 
      format?: 'webp' | 'jpeg' 
    };
    lockKey?: string;
  }) {

    const { hash, sig, fileBuffer, crop, lockKey } = opts;
    const cacheKey = `img:${hash}:${sig}`; 

    try {
      // нормализация
      const normalized = await sharp(fileBuffer).rotate().toBuffer();
      const left = Math.floor(Number(crop.x));
      const top = Math.floor(Number(crop.y));
      const width = Math.floor(Number(crop.w));
      const height = Math.floor(Number(crop.h));
      const quality = Math.max(1, Math.min(100, Math.floor(Number(crop.quality ?? 82))));
      const fmt: 'webp' | 'jpeg' = (crop.format ?? 'webp');

      // обрезка и сжатие
      let img = sharp(normalized).extract({ left, top, width, height });
      img = fmt === 'webp' ? img.webp({ quality }) : img.jpeg({ quality });
      const outBuf = await img.toBuffer();
      const meta = await sharp(outBuf).metadata();

      // ключ для хранилища
      const key = `images/${hash}/${sig}.${fmt}`;

      // загрузка в хранилище
      await this.storage.putObject(key, outBuf, contentType(fmt));

      // транзакция в БД
      const saved = await this.prisma.$transaction(async (tx) => {
        const existing = await tx.image.findUnique({
          where: { hash_cropSig: { hash, cropSig: sig } },
          select: { id: true, version: true },
        });

        // если нет - создаем 
        if (!existing) {
          return tx.image.create({
            data: {
              hash,
              cropSig: sig,
              s3Bucket: this.storage.getBucket(),
              s3Key: key,
              width: meta.width ?? width,
              height: meta.height ?? height,
              mime: contentType(fmt),
              sizeBytes: BigInt(outBuf.length),
              meta: {},
              status: 'ready',
              version: 1,
            },
          });
        }
        // если есть - обновляем
        return tx.image.update({
          where: { id: existing.id },
          data: {
            s3Bucket: this.storage.getBucket(),
            s3Key: key,
            width: meta.width ?? width,
            height: meta.height ?? height,
            mime: contentType(fmt),
            sizeBytes: BigInt(outBuf.length),
            meta: {},
            status: 'ready',
            version: { increment: 1 },
          },
        });
      });

      // генерируем временную ссылку на скачивание
      const url = await this.storage.presignedUrl(key);
      const payload = {
        status: 'ready' as const,
        id: saved.id,
        bucket: saved.s3Bucket,
        key: saved.s3Key,
        width: saved.width,
        height: saved.height,
        mime: saved.mime,
        size: Number(saved.sizeBytes),
        version: saved.version,
        url,
        last_verified_at: Math.floor(Date.now() / 1000),
      };

      // кладем в кэш
      const ttl = Number(process.env.CACHE_TTL_SECONDS ?? 1200);
      await this.cache.set(cacheKey, payload, ttl);
      return payload;
    } finally {
      if (lockKey) {
        await this.cache.unlock(lockKey).catch(() => void 0);
      }
    }
  }
}
