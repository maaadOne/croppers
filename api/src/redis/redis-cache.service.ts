import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
	private readonly redis: Redis;
	private readonly ttlDefault: number;

	constructor() {
		const url = process.env.REDIS_URL;
		if (!url) {
			throw new Error('REDIS_URL is not set');
		}
		this.redis = new Redis(url);
		this.ttlDefault = Number(process.env.CACHE_TTL_SECONDS ?? 1200);
	}

	async onModuleDestroy() {
		await this.redis.quit();
	}

	// Базовые методы хранения и обновления
	async get<T = any>(key: string): Promise<T | null> {
		const s = await this.redis.get(key);
		return s ? (JSON.parse(s) as T) : null;
	}
	async set(key: string, val: any, ttlSec?: number) {
		const s = JSON.stringify(val);
		if (ttlSec) await this.redis.set(key, s, 'EX', ttlSec);
		else await this.redis.set(key, s, 'EX', this.ttlDefault);
	}
	async del(key: string) {
		await this.redis.del(key);
	}
	async touch(key: string, ttlSec?: number) {
		await this.redis.expire(key, ttlSec ?? this.ttlDefault);
	}

	// Для проверки уникальности картинок
	async addKnownHash(hash: string) {
		await this.redis.sadd('img:known', hash);
	}
	async isKnownHash(hash: string) {
		return (await this.redis.sismember('img:known', hash)) === 1;
	}

	// Лочим, чтобы не было параллельных обработок одного и того же файла
	async tryLock(key: string, ttlMs: number): Promise<boolean> {
		const res = await this.redis.set(key, '1', 'PX', ttlMs, 'NX');
		return res === 'OK';
	}
	async unlock(key: string) {
		await this.redis.del(key);
	}

	// Pub/Sub (простая публикация)
	async publish(channel: string, message: string) {
		await this.redis.publish(channel, message);
	}
}
