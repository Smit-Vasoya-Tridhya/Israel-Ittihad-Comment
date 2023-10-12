import { Document } from 'mongoose';

export interface IRole extends Document {
  row_id: number;
  role: string;
  site: string;
  section: string;
  keepValue: boolean;
  permission: any[];
  is_deleted: boolean;
  updatedBy: string;
  createdBy: string;
}
