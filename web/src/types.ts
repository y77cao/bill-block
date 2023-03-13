export type Invoice = {
  id: string;
  providerAddress: string;
  clientAddress: string;
  date: Date;
  dueDate: Date;
  itemName: string;
  itemDescription: string;
  token: string;
  amount: string;
  currency?: string;
  tokenAddress?: string;
  milestones?: unknown[];
  status: InvoiceStatus;
  isErc721: boolean;
};

export enum InvoiceStatus {
  CREATED = 0,
  FUNDED,
  TERMINATED,
}
