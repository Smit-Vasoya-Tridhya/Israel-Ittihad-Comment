import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';

export class PageSettingDto {
  // @IsString()
  @IsArray()
  pages_notifications: any[];

  @IsArray()
  comment_notifications: any[];

  @IsString()
  top_banner_image: string;

  @IsString()
  logo_image: string;

  @IsString()
  login_image: string;

  @IsString()
  top_title: string;

  @IsString()
  sub_title: string;

  @IsBoolean()
  MustLogin: boolean;

  @IsString()
  footer_text: string;

  @IsString()
  terms_privacy_policy: string;

  @IsString()
  terms_privacy_policy_url: string;

  @IsString()
  google_client_id: string;

  @IsString()
  confirm_email_from: string;

  @IsString()
  confirm_email_reply: string;

  @IsString()
  confrim_email_sub: string;

  @IsString()
  confirm_email_message: string;

  @IsString()
  reset_email_from: string;

  @IsString()
  reset_email_reply: string;

  @IsString()
  reset_email_sub: string;

  @IsString()
  reset_email_message: string;

  @IsString()
  newpage_email_from: string;

  @IsString()
  newpage_email_reply: string;

  @IsString()
  newpage_email_sub: string;

  @IsString()
  newpage_email_message: string;

  @IsString()
  newcommit_email_from: string;

  @IsString()
  newcommit_email_reply: string;

  @IsString()
  newcommit_email_sub: string;

  @IsString()
  newcommit_email_message: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  updatedBy: string;

  @ApiProperty()
  @IsString()
  @MaxLength(30)
  @IsNotEmpty()
  createddBy: string;

  @IsString()
  site: string;
}
