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

// Types for new entries being created
export interface NewReimbursementRequest {
  id: string;
  'Request No.': string;
  Requestor: string;
  'Requested Item': string;
  Amount: string;
  'Date Released': string;
  Actions: string;
  isNew: boolean;
}

export interface NewRequisitionRequest {
  id: string;
  'Request No.': string;
  Requestor: string;
  'Requested Item': string;
  Amount: string;
  'O.R No.': string;
  'Invoice No.': string;
  'Date Requested': string;
  Actions: string;
  isNew: boolean;
}
