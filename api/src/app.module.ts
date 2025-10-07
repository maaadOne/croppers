import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ImagesModule } from './images/images.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
		}),
		PrismaModule,
		RedisModule,
		StorageModule,
		ImagesModule,
	],
})
export class AppModule {}
