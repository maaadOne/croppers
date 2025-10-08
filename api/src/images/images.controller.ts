import {
    BadRequestException,
  Body, Controller, Get, HttpCode, Param, Post, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { sha256, cropSignature } from '../utils/hash';
import { ImagesService } from './images.service';
import { RedisCacheService } from 'src/redis/redis-cache.service';
import { ImagesProcessor } from './images.processor';
import { UploadImageDto } from './images.dto';
import { memoryStorage } from 'multer';
import sharp from 'sharp';
import { ImagesFacade } from './image.facade';

@Controller('images')
export class ImagesController {
  constructor(private readonly facade: ImagesFacade) {}

  @HttpCode(200)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } }))
  async upload(@UploadedFile() file: Express.Multer.File, @Body() dto: UploadImageDto) {
    return this.facade.upload(file, dto);
  }

  @Get('image/:hash/:sig')
  async getImage(@Param('hash') hash: string, @Param('sig') sig: string) {
    return this.facade.getImage(hash, sig);
  }
}