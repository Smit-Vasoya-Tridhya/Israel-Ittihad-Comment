import { Document } from 'mongoose';

export interface IAdmin extends Document {
  row_id: number;
  status: string;
  site: string;
  user_type: string;
  lastSeen: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  password: string;
  is_deleted: string;
  updatedBy: string;
  createdBy: string;
}
