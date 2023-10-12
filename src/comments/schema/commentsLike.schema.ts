import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema, ObjectId } from 'mongoose';
import { Comments } from './comment.schema';

export type CommentLikeDocument = CommentLike & Document;

@Schema({ timestamps: true })
export class CommentLike extends Document {
    @Prop({ type: MongoSchema.Types.ObjectId })
    userId: ObjectId;

    @Prop({ type: MongoSchema.Types.ObjectId })
    pageId: ObjectId;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'comments' })
    commentId: Comments;

    @Prop({ type: Boolean })
    like: boolean;

    @Prop({ type: String })
    ip: string;
}

export const commentLikeSchema = SchemaFactory.createForClass(CommentLike);
