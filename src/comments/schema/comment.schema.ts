import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema, ObjectId } from 'mongoose';
import { User } from 'src/user/schema/user.schema';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comments extends Document {
    @Prop({ type: Number, required: true })
    row_id: number;

    @Prop({ type: String, required: true })
    originalComment: string;

    @Prop({ type: String })
    updatedComment: string;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'User' })
    userId: User;

    @Prop({
        type: String,
        enum: ['israel-today', 'ittihad-today'],
        required: true,
    })
    site: string;

    @Prop({ type: Array, default: [] })
    like: [MongoSchema.Types.ObjectId];

    @Prop({ type: Date })
    approvalDate: Date;

    @Prop({ type: String, enum: ['pending', 'approved', 'notApproved'], default: 'pending' })
    status: string;

    @Prop({ type: MongoSchema.Types.ObjectId })
    pageId: ObjectId;

    @Prop({ type: MongoSchema.Types.ObjectId })
    updatedBy: ObjectId;

    @Prop({ type: Array, default: [] })
    replyComments: [MongoSchema.Types.ObjectId];

    @Prop({ type: String })
    ip: string;
}

export const commentSchema = SchemaFactory.createForClass(Comments);
