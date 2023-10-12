import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateRoleDto {
  @IsNumber()
  @MaxLength(10)
  @IsNotEmpty()
  row_id: number;

  @ApiProperty({ default: 'superAdmin' })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    default: `{
        "role": "superAdmin",
        "site": "israelBackOffice",
        "keepValue": false,
        "permissions": [
          {
            "section": "users",
            "permissions": {
              "read": true,
              "write": true,
              "notApplicable": false
            }
          },
          {
            "section": "setting",
            "permissions": {
              "read": true,
              "write": true,
              "notApplicable": false
            }
          },
          {
            "section": "comments",
            "permissions": {
              "read": true,
              "write": true,
              "notApplicable": false
            }
          },
          {
            "section": "pages",
            "permissions": {
              "read": true,
              "write": true,
              "notApplicable": false
            }
          },
          {
            "section": "harmfulWords",
            "permissions": {
              "read": true,
              "write": true,
              "notApplicable": false
            }
          }
        ]
      }`,
  })
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  permission: any[];

  @IsBoolean()
  @IsNotEmpty()
  is_deleted: boolean;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  updatedBy: string;

  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  createdBy: string;
}
