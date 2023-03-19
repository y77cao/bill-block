export type Invoice = {
  id?: number;
  providerAddress: string;
  clientAddress: string;
  date: Date;
  dueDate: Date;
  itemName: string;
  itemDescription?: string;
  tokenSymbol: string | null;
  amount: string | null;
  tokenAddress: string | null;
  tokenId: number | null;
  milestones?: Milestone[];
  currMilestone?: number;
  status?: InvoiceStatus;
  tokenType: TokenType;
};

export type Milestone = {
  name: string;
  amount: string;
};

export enum InvoiceStatus {
  CREATED = 0,
  FUNDED,
  PARTIALLY_PAID,
  PAID,
  TERMINATED,
}

export enum TokenType {
  ETH = "ETH",
  ERC20 = "ERC20",
  ERC721 = "ERC721",
}
