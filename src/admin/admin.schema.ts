import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongoSchema } from 'mongoose';
import { Role } from 'src/role_permission/role.schema';

export type AdminDocument = Admin & Document;

const validateEmail = function (email: string) {
    const mailRegex =
        /^([A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9]))$/;
    return mailRegex.test(email);
};

@Schema({ timestamps: true })
export class Admin extends Document {
    @Prop({ type: Number })
    row_id: number;

    @Prop({
        type: String,
        enum: ['active', 'inActive', 'deleted'],
        default: 'active',
    })
    status: string;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Role' })
    user_type: Role;

    @Prop({ type: String })
    firstname: string;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Admin', default: null })
    updatedBy: Admin;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: 'Admin', default: null })
    createdBy: Admin;

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
    fullname: string;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
AdminSchema.clearIndexes();
