import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema, ObjectId } from 'mongoose';

export type HistoryLogsDocument = HistoryLogs & Document;

@Schema({ timestamps: true })
export class HistoryLogs extends Document {
    @Prop({ type: Number, required: true })
    row_id: string;

    @Prop({ type: String, required: true })
    method: string;

    @Prop({ type: Object, required: true })
    data: any;

    @Prop({ type: String, required: true })
    site: string;

    @Prop({ type: String, required: true })
    module: string;

    @Prop({ type: MongoSchema.Types.ObjectId })
    updatedBy: ObjectId;

    @Prop({ type: MongoSchema.Types.ObjectId })
    logId: ObjectId;
}

export const HistoryLogsSchema = SchemaFactory.createForClass(HistoryLogs);
