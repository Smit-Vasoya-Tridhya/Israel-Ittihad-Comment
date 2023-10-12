import { Schema, Prop, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Admin } from 'src/admin/admin.schema';
import { Role } from 'src/role_permission/role.schema';

const validateEmail = function (email: string) {
    const mailRegex =
        /^([A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9]))$/;
    return mailRegex.test(email);
};

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ type: Number })
    row_id: number;

    @Prop({
        type: String,
        enum: ['active', 'inActive', 'deleted'],
        default: 'active',
    })
    status: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role' })
    user_type: Role;

    @Prop({ type: String })
    firstname: string;

    @Prop({ type: Date })
    lastSeen: Date;

    @Prop({ type: String })
    lastname: string;

    @Prop({
        // unique: true,
        required: true,
        type: String,
        // validate: [validateEmail, 'Please fill a valid email address'],
    })
    email: string;

    @Prop({ required: true, type: String })
    phone: string;

    @Prop({ required: true, type: String })
    password: string;

    @Prop({
        type: String,
        required: true,
        enum: ['systemBackOffice', 'israelBackOffice', 'ittihadBackOffice'],
    })
    site: string;

    @Prop({ default: false, type: Boolean })
    is_deleted: boolean;

    @Prop({ type: Number })
    otpExpire: number;

    @Prop({ type: String })
    passwordResetToken: string;

    @Prop({ type: Number })
    passwordResetExpires: number;

    @Prop({ length: 6, type: Number })
    otp: number;

    @Prop({ type: String })
    device: string;

    @Prop({ type: String })
    ipAddress: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin' })
    updatedBy: Admin;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin' })
    createdBy: Admin;

    @Prop({ type: String })
    fullname: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.clearIndexes();
