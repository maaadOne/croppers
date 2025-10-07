type ImageFormat = 'jpeg' | 'webp';

type NormCrop = Readonly<{
	x: number;
	y: number;
	w: number;
	h: number;
	quality: number;
	format: ImageFormat;
}>;

interface BaseJob {
	hash: string;
	sig: string;
	key: string;
}

export interface UploadProcessing extends BaseJob {
	status: 'processing';
}

export type UploadReady = Readonly<{
	status: 'ready';
	id: string | number;
	bucket: string;
	key: string;
	hash: string;
	sig: string;
	width: number;
	height: number;
	mime: string;
	size: number;
	version: number;
	url: string;
	last_verified_at: number;
}>;

export type UploadResult = UploadProcessing | UploadReady;
export type GetImageResult = UploadResult;

export interface ProcessArgs {
	hash: string;
	sig: string;
	fileBuffer: Buffer;
	crop: NormCrop;
	lockKey?: string;
}

export type ProcessOptions = Readonly<{
	hash: string;
	sig: string;
	fileBuffer: Buffer;
	crop: {
		x: number;
		y: number;
		w: number;
		h: number;
		quality?: number;
		format?: ImageFormat;
	};
	lockKey?: string;
}>;
