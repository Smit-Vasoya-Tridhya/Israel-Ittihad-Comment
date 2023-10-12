import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ArticlePageUserDocument = ArticlePageUser & Document;

@Schema({ timestamps: true })
export class ArticlePageUser extends Document {
    @Prop({ type: Number, default: 1 })
    row_id: number;

    @Prop({ type: String })
    email: string;

    @Prop({ type: String })
    password: string;

    @Prop({ type: String })
    name: string;

    @Prop({ type: String })
    ip: string;

    @Prop({ type: Date })
    lastSeen: Date;

    @Prop({ type: String })
    device: string;

    @Prop({ type: String, enum: ['active', 'inActive'], default: 'active' })
    status: string;

    @Prop({ type: String, enum: ['israel-today', 'ittihad-today'] })
    site: string;

    @Prop({ type: Boolean, default: false })
    emailVerified: boolean;

    @Prop({ type: String })
    passwordResetToken: string;

    @Prop({ type: String })
    accountConfirmToken: string;

    @Prop({ type: Number })
    passwordResetExpires: number;

    @Prop({ type: Boolean, default: false })
    loggedInViaGoogle: boolean;

    @Prop({ type: String })
    googleData: string;

    @Prop({ type: MongooseSchema.Types.ObjectId })
    updatedBy: MongooseSchema.Types.ObjectId;

    @Prop({ type: Number })
    otpExpire: number;

    @Prop({ length: 6, type: Number })
    otp: number;

    @Prop({ type: Number })
    passWordResetOtpExpire: number;

    @Prop({ length: 6, type: Number })
    passWordResetOtp: number;

    @Prop({ type: String })
    image: string;
}

export const ArticlePageUserSchema = SchemaFactory.createForClass(ArticlePageUser);
