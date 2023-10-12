import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Schema as MongoSchema } from 'mongoose';
import { Admin } from 'src/admin/admin.schema';

export type RoleDocument = Role & Document;

@Schema({ timestamps: true })
export class Role extends Document {
  @Prop()
  row_id: Number;

  @ApiProperty({ default: 'Super Admin' })
  @Prop({ required: true })
  role: string;

  @ApiProperty({ default: 'israelBackOffice' })
  @Prop({
    required: true,
    enum: ['systemBackOffice', 'israelBackOffice', 'ittihadBackOffice'],
  })
  site: string;

  @Prop({ type: Boolean, default: false })
  keepValue: boolean;

  @Prop([
    {
      section: { type: String, required: true },
      permissions: {
        read: { type: Boolean, required: true },
        write: { type: Boolean, required: true },
        notApplicable: { type: Boolean, required: true },
      },
    },
  ])
  permissions: {
    section: string;
    permissions: { read: boolean; write: boolean; notApplicable: boolean };
  }[];

  @Prop({ type: Boolean, default: false })
  is_deleted: boolean;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Admin', default: null })
  updatedBy: Admin;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Admin', default: null })
  createdBy: Admin;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
