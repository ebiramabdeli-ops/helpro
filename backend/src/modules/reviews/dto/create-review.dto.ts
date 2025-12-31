import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsObject, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  taskId: string;

  @IsUUID()
  @IsNotEmpty()
  reviewedId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsObject()
  @IsOptional()
  ratings?: {
    quality?: number;
    communication?: number;
    punctuality?: number;
    professionalism?: number;
  };

  @IsString()
  @IsNotEmpty()
  comment: string;
}
