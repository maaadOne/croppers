import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ImagesConfig } from './image.config';
import { ImagesFacade } from './image.facade';
import { ImagesController } from './images.controller';
import { ImagesProcessor } from './images.processor';
import { ImagesRepository } from './images.repository';
import { ImagesService } from './images.service';

@Module({
	imports: [ConfigModule],
	controllers: [ImagesController],
	providers: [
		ImagesService,
		ImagesRepository,
		ImagesProcessor,
		ImagesFacade,
		ImagesConfig,
	],
})
export class ImagesModule {}
