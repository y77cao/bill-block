import { Invoice, InvoiceStatus, TokenType } from "./types";
import { ethers } from "ethers";
import { networkIdToTokenSymbolToAddresses } from "./constants";
import { LocalStorageClient } from "./clients/localStorageClient";

export const parseInvoices = async (invoices): Promise<Invoice[]> => {
  const ids = invoices.map((invoice) => invoice.id);
  const invoiceMetadata = await Promise.all(
    ids.map((id) => LocalStorageClient.get(id.toNumber()))
  );

  return invoices.map((invoice) => {
    const {
      provider,
      client,
      token,
      id,
      terminationTime,
      total,
      amounts,
      currMilestone,
      amountReleased,
      status,
      isErc721,
    } = invoice;

    const tokenType =
      token === ethers.constants.AddressZero
        ? TokenType.ETH
        : isErc721
        ? TokenType.ERC721
        : TokenType.ERC20;

    const metadata = invoiceMetadata.find(
      (metadata) => metadata?.id === id.toNumber()
    );

    return {
      id: id.toNumber(),
      providerAddress: provider,
      clientAddress: client,
      date: metadata?.date.split("T")[0],
      dueDate: new Date(terminationTime * 1000).toISOString().split("T")[0],
      itemName: metadata?.itemName,
      itemDescription: metadata?.itemDescription,
      tokenSymbol: metadata?.tokenSymbol,
      amount: ethers.utils.formatEther(total),
      tokenAddress: token,
      tokenId: isErc721 ? total.toNumber() : null,
      milestones: metadata?.milestones,
      currMilestone: currMilestone.toNumber(),
      status: status as InvoiceStatus,
      tokenType,
    };
  });
};

export const getTokenAddressFromSymbol = (symbol: string) => {
  return networkIdToTokenSymbolToAddresses[
    process.env.NEXT_PUBLIC_NETWORK_ID as string
  ][symbol];
};

export const getTokenSymbolFromAddress = async (
  address: string | undefined,
  provider: ethers.providers.Web3Provider
) => {
  if (!address) return "ETH";
  const ercContract = new ethers.Contract(
    address,
    ["function symbol() view returns (string)"],
    provider
  );
  return await ercContract.symbol();
};
