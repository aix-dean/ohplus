import { Timestamp } from 'firebase/firestore';

export interface BaseRequest {
  id: string;
  company_id: string;
  request_type: 'reimbursement' | 'requisition';
  'Request No.': number;
  Requestor: string;
  'Requested Item': string;
  Amount: number;
  Currency: string; // Add Currency field
  'Approved By': string;
  Attachments: string;
  Actions: string;
  created: Timestamp;
  deleted: boolean;
}

export interface ReimbursementRequest extends BaseRequest {
  request_type: 'reimbursement';
  'Date Released': Timestamp;
}

export interface RequisitionRequest extends BaseRequest {
  request_type: 'requisition';
  Cashback: number;
  'O.R No.': string;
  'Invoice No.': string;
  Quotation: string;
  'Date Requested': Timestamp;
}

export type FinanceRequest = ReimbursementRequest | RequisitionRequest;
