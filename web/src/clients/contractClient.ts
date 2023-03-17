import { Invoice, TokenType } from "@/types";
import { ethers, BigNumber } from "ethers";

import InvoiceFactory from "../abi/InvoiceFactory.json";
import ERC20 from "../abi/ERC20.json";
import ERC721 from "../abi/ERC721.json";
import { getTokenAddressFromSymbol, getTokenSymbolFromAddress } from "@/utils";
import { LocalStorageClient } from "./localStorageClient";

// @ts-ignore
export class ContractClient {
  // TODO types
  provider;
  contract;
  constructor(provider, contract) {
    this.provider = provider;
    this.contract = contract;
  }

  static async initContract() {
    // @ts-ignore checked below
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (!metamaskIsInstalled) throw new Error("Please install Metamask");
    const networkId = await ethereum.request({
      method: "net_version",
    });
    if (networkId !== process.env.NEXT_PUBLIC_NETWORK_ID) {
      const networkStr =
        process.env.NEXT_PUBLIC_NETWORK_ID === "1"
          ? "Ethereum mainnet"
          : "Goerli testnet";
      throw new Error(
        `Unsupported network. Please make sure that your are on ${networkStr}.`
      );
    }

    const provider = new ethers.providers.Web3Provider(ethereum);
    const contract = new ethers.Contract(
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
      InvoiceFactory,
      provider
    );

    return { provider, contract };
  }
  static async connectWallet() {
    // @ts-ignore checked below
    const { ethereum } = window;
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask;
    if (!metamaskIsInstalled) throw new Error("Please install Metamask");
    const networkId = await ethereum.request({
      method: "net_version",
    });
    if (networkId !== process.env.NEXT_PUBLIC_NETWORK_ID) {
      const networkStr =
        process.env.NEXT_PUBLIC_NETWORK_ID === "1"
          ? "Ethereum mainnet"
          : "Goerli testnet";
      throw new Error(
        `Unsupported network. Please make sure that your are on ${networkStr}.`
      );
    }

    const accounts = await ethereum.request({
      method: "eth_requestAccounts",
    });

    return accounts[0];
  }

  async withdraw(tokenId: number, balance: BigNumber): Promise<BigNumber> {
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);
    const txn = await contractWithSigner.withdraw(tokenId, balance);
    await txn.wait();
    return txn;
  }

  async getInvoicesByProvider(providerAddress: string) {
    return this.contract.getInvoicesByProvider(providerAddress);
  }

  async getInvoicesByClient(clientAddress: string) {
    return this.contract.getInvoicesByClient(clientAddress);
  }

  async createInvoice(invoice: Invoice) {
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    const {
      clientAddress,
      providerAddress,
      date,
      dueDate,
      itemName,
      itemDescription,
      tokenSymbol,
      amount,
      tokenAddress,
      milestones,
      tokenType,
    } = invoice;

    const amountInWei = ethers.utils.parseEther(amount);
    const epochDate = Math.round(dueDate.getTime() / 1000);
    const epochDueDate = Math.round(dueDate.getTime() / 1000);

    const nonEthTokenAddress =
      tokenAddress || getTokenAddressFromSymbol(tokenSymbol as string);
    const invoiceTokenAddress =
      tokenType === TokenType.ETH
        ? ethers.constants.AddressZero
        : nonEthTokenAddress;

    const invoiceTokenSymbol =
      tokenSymbol ||
      (await getTokenSymbolFromAddress(tokenAddress as string, this.provider));

    const txn = await contractWithSigner.createInvoice(
      clientAddress,
      providerAddress,
      invoiceTokenAddress,
      [amountInWei],
      epochDueDate,
      tokenType === TokenType.ERC721 // isErc721
    );
    const receipt = await txn.wait();
    const invoiceId = receipt?.events[0]?.args?.id?.toNumber();

    // TODO move to be called by redux?? hacky af
    LocalStorageClient.set(invoiceId, {
      id: invoiceId,
      date,
      dueDate,
      itemName,
      itemDescription,
      tokenSymbol: tokenType === TokenType.ETH ? "ETH" : invoiceTokenSymbol,
      milestones: [], // TODO,
    });

    return txn;
  }

  async payInvoice(invoice: Invoice) {
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    const { id, amount, tokenAddress, tokenType } = invoice;
    const amountInWei = ethers.utils.parseEther(amount);
    // const amountsInWei = amounts.map((amount) =>
    //   ethers.utils.parseEther(amount)
    // );

    if (tokenType === TokenType.ERC20) {
      await this.erc20Approve(amountInWei, tokenAddress as string);
    } else if (tokenType === TokenType.ERC721) {
      await this.erc721Approve(amount, tokenAddress as string);
    }

    const txn = await contractWithSigner.deposit(
      id,
      tokenAddress,
      [amountInWei],
      tokenType === TokenType.ERC721, // isErc721
      { value: tokenType === TokenType.ETH ? amountInWei : 0 }
    );
    await txn.wait();
    return txn;
  }

  private async erc20Approve(amount: BigNumber, tokenAddress: string) {
    const signer = this.provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC20, signer);
    const txn = await tokenContract.approve(this.contract.address, amount);
    await txn.wait();
    return txn;
  }

  private async erc721Approve(tokenId: string, tokenAddress: string) {
    const signer = this.provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC721, signer);
    const txn = await tokenContract.approve(this.contract.address, tokenId);
    await txn.wait();
    return txn;
  }
}
