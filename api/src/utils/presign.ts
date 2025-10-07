import type { S3Client } from '@aws-sdk/client-s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function presignGetObject(
	s3: S3Client,
	bucket: string,
	key: string,
	expiresInSec = 3600,
) {
	const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
	return getSignedUrl(s3, cmd, { expiresIn: expiresInSec });
}
