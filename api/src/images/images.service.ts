import { Injectable } from '@nestjs/common';
import { ImagesRepository } from './images.repository';

@Injectable()
export class ImagesService {
  constructor(private readonly repo: ImagesRepository) {}

  findByHashAndSig(hash: string, cropSig: string) {
    return this.repo.findByHashAndSig(hash, cropSig);
  }
  findReady(hash: string, sig: string) {
    return this.repo.findByHashAndSig(hash, sig);
  }
  markProcessing(hash: string, sig: string) {
    return this.repo.markProcessing(hash, sig);
  }
  upsertReady(input: {
    hash: string; cropSig: string; s3Bucket: string; s3Key: string;
    width: number; height: number; mime: string; sizeBytes: number; meta?: any;
  }) {
    return this.repo.upsertReady(input);
  }
  getVersion(hash: string, sig: string) {
    return this.repo.getVersion(hash, sig);
  }
}
