import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { UploadImageDto } from './images.dto';
import { ImagesService } from './images.service';
import { RedisCacheService } from '../redis/redis-cache.service';
import { ImagesProcessor } from './images.processor';
import { sha256, cropSignature } from '../utils/hash';
import { ImagesConfig } from './image.config';

@Injectable()
export class ImagesFacade {
  private readonly logger = new Logger(ImagesFacade.name);

  constructor(
    private readonly images: ImagesService,
    private readonly cache: RedisCacheService,
    private readonly processor: ImagesProcessor,
    private readonly cfg: ImagesConfig,
  ) {}

  async upload(file: Express.Multer.File, dto: UploadImageDto) {
    if (!file?.buffer) throw new BadRequestException('File is required');

    // 1) нормализация/валидация входа
    const norm = await this.normalizeAndValidate(file.buffer, dto);

    // 2) ключи идемпотентности
    const hash = sha256(file.buffer);
    const sig  = cropSignature(norm);
    const cacheKey = `img:${hash}:${sig}`;
    const lockKey  = `lock:${cacheKey}`;
    const keyForResponse = `images/${hash}/${sig}.${norm.format}`;

    // 3) кеш read-through
    const cached = await this.cache.get(cacheKey);
    if (cached?.status === 'ready') return cached;
    if (this.cfg.mode === 'async' && cached?.status === 'processing') {
      return { status: 'processing', hash, sig, key: keyForResponse };
    }

    // 4) локаем
    let locked = await this.cache.tryLock(lockKey, this.cfg.lockTtlMs);
    if (!locked && this.cfg.mode === 'sync') {
      for (let i = 0; i < 10 && !locked; i++) {
        await new Promise(r => setTimeout(r, 200));
        locked = await this.cache.tryLock(lockKey, this.cfg.lockTtlMs);
      }
    }

    try {
      if (this.cfg.mode === 'sync') {
        await this.cache.addKnownHash(hash);
        const payload = await this.processor.process({ hash, sig, fileBuffer: file.buffer, crop: norm });
        await this.cache.set(cacheKey, payload, this.cfg.cacheTtlSec);
        return payload;
      } else {
        await this.cache.set(cacheKey, { status: 'processing' }, 300);
        await this.images.markProcessing(hash, sig);
        await this.cache.addKnownHash(hash);
        // рекомендуется очередь вместо прямого вызова:
        this.processor.process({ hash, sig, fileBuffer: file.buffer, crop: norm, lockKey })
          .then(() => this.logger.log(`process done ${hash}/${sig}`))
          .catch(err => this.logger.error(`process failed ${hash}/${sig}`, err.stack));
        return { status: 'processing', hash, sig, key: keyForResponse };
      }
    } finally {
      if (locked) await this.cache.unlock(lockKey).catch(() => void 0);
    }
  }

  async getImage(hash: string, sig: string) {
    const cacheKey = `img:${hash}:${sig}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    if (await this.cache.isKnownHash(hash)) {
      const fromDb = await this.images.findReady(hash, sig);
      if (fromDb?.status === 'ready') {
        const payload = {
          status: 'ready',
          id: fromDb.id,
          bucket: fromDb.s3Bucket,
          key: fromDb.s3Key,
          width: fromDb.width,
          height: fromDb.height,
          mime: fromDb.mime,
          size: Number(fromDb.sizeBytes),
          version: fromDb.version,
        };
        await this.cache.set(cacheKey, payload, this.cfg.cacheTtlSec);
        return payload;
      }
    }
    return { status: 'processing' };
  }

  private async normalizeAndValidate(buf: Buffer, dto: UploadImageDto) {
    // приведение типов + дефолты
    const x = Number(dto.x), y = Number(dto.y), w = Number(dto.w), h = Number(dto.h);
    const quality = dto.quality != null ? Number(dto.quality) : 82;
    const format = ((dto.format === 'jpg' ? 'jpeg' : dto.format) ?? 'webp') as 'webp' | 'jpeg';

    const meta = await sharp(buf).metadata();
    if (!meta.width || !meta.height) throw new BadRequestException('Unsupported image');
    if (x < 0 || y < 0 || w < 1 || h < 1 || x + w > meta.width || y + h > meta.height) {
      throw new BadRequestException('Crop area out of bounds');
    }
    return { x, y, w, h, quality, format } as const;
  }
}
