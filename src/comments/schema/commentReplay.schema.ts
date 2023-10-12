import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema, ObjectId } from 'mongoose';
import { Comments } from './comment.schema';

export type CommentReplayDocument = CommentReplay & Document;

@Schema({ timestamps: true })
export class CommentReplay extends Document {
    @Prop({ type: String, required: true })
    commentReplay: string;

    @Prop({ type: String, required: true })
    site: string;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Comment' })
    commentId: Comments;

    @Prop({ type: MongoSchema.Types.ObjectId })
    userId: ObjectId;

    @Prop({ type: Array, default: [] })
    like: any[];

    @Prop({ type: String })
    ip: string;

    @Prop({ type: MongoSchema.Types.ObjectId })
    updatedBy: ObjectId;
}

export const commentReplaySchema = SchemaFactory.createForClass(CommentReplay);
