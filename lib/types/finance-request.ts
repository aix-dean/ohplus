import type { Timestamp } from "firebase/firestore";

interface BaseRequest {
  id: string;
  company_id: string;
  created: Timestamp;
  request_type: 'reimbursement' | 'requisition';
  'Request No.': number;
  Requestor: string;
  'Requested Item': string;
  Amount: number;
  'Approved By': string;
  Attachments: string; // URL
  Actions: string;
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
  Quotation: string; // URL
  'Date Requested': Timestamp;
}

export type FinanceRequest = ReimbursementRequest | RequisitionRequest;
