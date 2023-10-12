import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema } from 'mongoose';

export type PageSettingDocument = page_setting & Document;
@Schema({ timestamps: true })
export class page_setting extends Document {
  @Prop({ required: true })
  pages_notifications: any[];

  @Prop({ required: true })
  comment_notifications: any[];

  @Prop({ required: true })
  top_banner_image: string;

  @Prop({ required: true })
  logo_image: string;

  @Prop({ required: true })
  login_image: string;

  @Prop({ required: true })
  top_title: string;

  @Prop({ required: true })
  sub_title: string;

  @Prop({ default: false })
  mustLogin: boolean;

  @Prop({ required: true })
  footer_text: string;

  @Prop({ required: true })
  terms_privacy_policy: string;

  @Prop({ required: true })
  terms_privacy_policy_url: string;

  @Prop({ required: true })
  google_client_id: string;

  @Prop({ required: true })
  confirm_email_from: string;

  @Prop({ required: true })
  confirm_email_reply: string;

  @Prop({ required: true })
  confrim_email_sub: string;

  @Prop({ required: true })
  confirm_email_message: string;

  @Prop({ required: true })
  reset_email_from: string;

  @Prop({ required: true })
  reset_email_reply: string;

  @Prop({ required: true })
  reset_email_sub: string;

  @Prop({ required: true })
  reset_email_message: string;

  @Prop({ required: true })
  newpage_email_from: string;

  @Prop({ required: true })
  newpage_email_reply: string;

  @Prop({ required: true })
  newpage_email_sub: string;

  @Prop({ required: true })
  newpage_email_message: string;

  @Prop({ required: true })
  newcommit_email_from: string;

  @Prop({ required: true })
  newcommit_email_reply: string;

  @Prop({ required: true })
  newcommit_email_sub: string;

  @Prop({ required: true })
  newcommit_email_message: string;

  @Prop({ type: String })
  updatedBy: MongoSchema.Types.ObjectId;

  @Prop({ type: String })
  createdBy: MongoSchema.Types.ObjectId;

  @Prop({
    required: true,
    enum: ['israelBackOffice', 'ittihadBackOffice'],
  })
  site: string;
}
export const SettingSchema = SchemaFactory.createForClass(page_setting);
