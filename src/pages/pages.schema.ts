import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Date, Document, Schema as MongooseSchema } from 'mongoose';

export type PageDocument = Page & Document;

@Schema({ timestamps: true })
export class Page extends Document {
  @Prop({ type: Number, default: 1 })
  row_id: number;

  @Prop({
    type: String,
    enum: ['active', 'pending', 'notApproved'],
    default: 'pending',
  })
  israelStatus: string;

  @Prop({
    type: String,
    enum: ['active', 'pending', 'notApproved'],
    default: 'pending',
  })
  ittihadStatus: string;

  @Prop({ type: String })
  israelPage: string;

  @Prop({ type: String })
  ittihadPage: string;

  @Prop({ type: Date })
  israelPublishDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  israelPublishBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: Date })
  ittihadPublishDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  ittihadPublishBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  israelPageCreatedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  israelPageUpdatedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  ittihadPageCreatedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  ittihadPageUpdatedBy: MongooseSchema.Types.ObjectId;

  @Prop({ type: String })
  israelPageScript: string;

  @Prop({ type: String })
  ittihadPageScript: string;

  @Prop({ type: String })
  isrealUrl: string;

  @Prop({ type: String })
  ittihadUrl: string;

  @Prop({ default: false })
  is_deleted: boolean;
}

export const PageSchema = SchemaFactory.createForClass(Page);
