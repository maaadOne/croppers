import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import { presignGetObject } from '../utils/presign';

@Injectable()
export class MinioService {
	private readonly s3: S3Client;
	private readonly bucket: string;
	private readonly signedTtl: number;

	constructor() {
		const endpoint = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
		this.s3 = new S3Client({
			region: process.env.S3_REGION ?? 'us-east-1',
			forcePathStyle: true,
			endpoint,
			credentials: {
				accessKeyId: process.env.MINIO_ACCESS_KEY!,
				secretAccessKey: process.env.MINIO_SECRET_KEY!,
			},
		});
		this.bucket = process.env.MINIO_BUCKET!;
		this.signedTtl = Number(process.env.S3_SIGNED_URL_TTL ?? 3600);
	}

	getBucket() {
		return this.bucket;
	}

	///
	///  Загружает файл в указанный ключ внутри бакета
	///
	async putObject(key: string, body: Buffer, contentType: string) {
		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: body,
				ContentType: contentType,
				ACL: 'private',
			}),
		);
	}

	///
	///  Генерирует временную ссылку для скачивания файла
	///
	async presignedUrl(key: string) {
		return presignGetObject(this.s3, this.bucket, key, this.signedTtl);
	}
}
