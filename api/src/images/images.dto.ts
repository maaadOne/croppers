import { IsIn, IsInt, Min, IsOptional } from 'class-validator';

export class UploadImageDto {
  @IsInt() @Min(0) x!: number;
  @IsInt() @Min(0) y!: number;
  @IsInt() @Min(1) w!: number;
  @IsInt() @Min(1) h!: number;

  @IsOptional() @IsInt() @Min(1) quality?: number;
  @IsOptional() @IsIn(['webp', 'jpeg', 'jpg']) format?: 'webp' | 'jpeg' | 'jpg';
}
