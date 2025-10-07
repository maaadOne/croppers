import crypto from 'crypto';

export function sha256(buf: Buffer) {
	return crypto.createHash('sha256').update(buf).digest('hex');
}

export function cropSignature(input: {
	x: number;
	y: number;
	w: number;
	h: number;
	quality?: number;
	format?: 'webp' | 'jpeg';
}) {
	const normalized = JSON.stringify({
		x: Math.round(input.x),
		y: Math.round(input.y),
		w: Math.round(input.w),
		h: Math.round(input.h),
		quality: input.quality ?? 82,
		format: input.format ?? 'webp',
	});
	return crypto.createHash('sha1').update(normalized).digest('hex');
}
