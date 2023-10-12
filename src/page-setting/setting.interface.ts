import { Document } from 'mongoose';

export interface IPage extends Document {
  readonly pages_notifications: any[];
  readonly comment_notifications: any[];

  top_banner_image: string;

  logo_image: string;

  login_image: string;

  readonly top_title: string;

  readonly sub_title: string;

  readonly MustLogin: boolean;

  readonly footer_text: string;

  readonly terms_privacy_policy: string;

  readonly terms_privacy_policy_url: string;

  readonly google_client_id: string;

  readonly confirm_email_from: string;

  readonly confirm_email_reply: string;

  readonly confrim_email_sub: string;

  readonly confirm_email_message: string;

  readonly reset_email_from: string;

  readonly reset_email_reply: string;

  readonly reset_email_sub: string;

  readonly reset_email_message: string;

  readonly newpage_email_from: string;

  readonly newpage_email_reply: string;

  readonly newpage_email_sub: string;

  readonly newpage_email_message: string;

  readonly newcommit_email_from: string;

  readonly newcommit_email_reply: string;

  readonly newcommit_email_sub: string;

  readonly newcommit_email_message: string;

  createddBy: string;

  updatedBy: string;
}
