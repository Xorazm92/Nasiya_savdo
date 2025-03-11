import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID} from 'class-validator';
import { IsPhoneNumber } from '../../../common';

export class CreateDebtorDto {
  @ApiProperty({ example: 'Zufarbek' })
  @IsNotEmpty()
  @IsString()
  full_name: string;

  @ApiProperty({ example: '+998977777777' })
  @IsNotEmpty()
  @IsPhoneNumber()
  @IsString()
  phone_number: string;

  @ApiProperty({ example: 'https://www.pinterest.com/pin/844776842600675743/' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'Tashkent, Uzbekistan' })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({ example: 'Some notes about the debtor' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  store_id: string;
}
