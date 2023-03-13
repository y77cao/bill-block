import { Invoice, InvoiceStatus } from "./types";
import { ethers } from "ethers";

export const parseInvoices = (invoices): Invoice[] => {
  return invoices.map((invoice) => {
    const {
      provider,
      client,
      token,
      id,
      dueDate,
      total,
      amounts,
      currMilestone,
      amountReleased,
      status,
      isErc721,
    } = invoice;

    return {
      id: id.toString(),
      providerAddress: provider,
      clientAddress: client,
      date: new Date(), // TODO
      dueDate: new Date(dueDate * 1000),
      itemName: "test", // TOD
      itemDescription: "test", // TODO
      token: "", // TODO
      amount: ethers.utils.formatEther(total),
      currency: token === ethers.constants.AddressZero ? "ETH" : "TOKEN", // TODO
      tokenAddress: token,
      milestones: [], // TODO
      status: InvoiceStatus[status],
      isErc721,
    };
  });
};
