import { IsIn, IsInt, IsOptional, Min } from 'class-validator';

export class UploadImageDto {
	@IsInt()
	@Min(0)
	@IsOptional()
	x?: number;

	@IsInt()
	@Min(0)
	@IsOptional()
	y?: number;

	@IsInt()
	@Min(1)
	w!: number;

	@IsInt()
	@Min(1)
	h!: number;

	@IsOptional()
	@IsInt()
	@Min(1)
	quality?: number;

	@IsOptional()
	@IsIn(['webp', 'jpeg', 'jpg'])
	format?: 'webp' | 'jpeg' | 'jpg';
}

export class UploadImageResponseDto {
	url: string;
	hash: string;
	sig: string;
	width: number;
	height: number;
}
