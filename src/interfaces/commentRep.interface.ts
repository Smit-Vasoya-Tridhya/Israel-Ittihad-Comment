import { Document } from 'mongoose';

export interface ICommentRep extends Document {
    commentReplay: string;
    commentId: string;
    userId: string;
}
