import { 
  IsEnum, 
  IsNotEmpty, 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsArray,
  IsDateString,
  Min,
  Max
} from 'class-validator';
import { TaskCategory } from '../../../common/enums';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(TaskCategory)
  @IsNotEmpty()
  category: TaskCategory;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsDateString()
  @IsNotEmpty()
  scheduledStartTime: string;

  @IsDateString()
  @IsOptional()
  scheduledEndTime?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedDuration?: number; // in minutes

  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  budgetAmount: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredSkills?: string[];

  @IsNumber()
  @Min(1)
  @IsOptional()
  helpersNeeded?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @IsString()
  @IsOptional()
  specialInstructions?: string;
}
