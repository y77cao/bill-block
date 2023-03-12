export type Invoice = {
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
};
