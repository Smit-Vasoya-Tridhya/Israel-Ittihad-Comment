import { Document } from 'mongoose';

export interface IWords extends Document {
  row_id: number;
  word: string;
  is_deleted: boolean;
  updatedBy: string;
  createdBy: string;
}
