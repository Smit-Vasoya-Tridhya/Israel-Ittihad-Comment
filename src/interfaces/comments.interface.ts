import { Document } from 'mongoose';

export interface IComment extends Document {
    row_id: number;
    originalComment: string;
    updatedComment: string;
    userId: string;
    site: string;
    like: any[];
    status: string;
    pageId: string;
    updatedBy: string;
    replyComments: any[];
}
