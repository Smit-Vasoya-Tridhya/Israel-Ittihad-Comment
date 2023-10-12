import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema } from 'mongoose';

export type Harmfull_WordDocument = Harmfull_Word & Document;
@Schema({ timestamps: true })
export class Harmfull_Word extends Document {
  @Prop()
  row_id: number;

  @Prop({ required: true })
  word: string;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ type: MongoSchema.Types.ObjectId })
  updatedBy: MongoSchema.Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId })
  createdBy: MongoSchema.Types.ObjectId;

  @Prop({ type: String, enum: ['israelBackOffice', 'ittihadBackOffice'] })
  site: string;
}

export const HarmfullWordSchema = SchemaFactory.createForClass(Harmfull_Word);
