import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { ImagesService } from './images.service';
import { ImagesRepository } from './images.repository';
import { ImagesProcessor } from './images.processor';
import { ImagesFacade } from './image.facade';
import { ImagesConfig } from './image.config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ ConfigModule ],
  controllers: [ImagesController],
  providers: [ImagesService, ImagesRepository, ImagesProcessor, ImagesFacade, ImagesConfig],
})
export class ImagesModule {}
