import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
type Mode = 'sync' | 'async';

@Injectable()
export class ImagesConfig {
  constructor(private readonly cfg: ConfigService) {}
  get mode(): Mode {
    return (this.cfg.get<string>('PROCESSING_MODE') ?? 'sync').toLowerCase() as Mode;
  }
  get cacheTtlSec(): number {
    return Number(this.cfg.get<string>('CACHE_TTL_SECONDS') ?? 1200);
  }
  get lockTtlMs(): number {
    return Number(this.cfg.get<string>('LOCK_TTL_MS') ?? 120_000);
  }
}
