import { Invoice, InvoiceCreate, TokenType } from "@/types";
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
    const accounts = await ethereum.request({
      method: "eth_accounts",
    });

    return {
      provider,
      contract,
      account: accounts.length ? accounts[0] : null,
    };
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

  async getInvoiceById(id: number) {
    return this.contract.getInvoice(id);
  }

  async getInvoicesByProvider(providerAddress: string) {
    return this.contract.getInvoicesByProvider(providerAddress);
  }

  async getInvoicesByClient(clientAddress: string) {
    return this.contract.getInvoicesByClient(clientAddress);
  }

  async createInvoice(invoice: InvoiceCreate) {
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    const {
      date,
      dueDate,
      itemName,
      itemDescription,
      tokenSymbol,
      tokenAddress,
      milestones,
      tokenType,
    } = invoice;

    const invoiceTokenSymbol =
      tokenSymbol ||
      (await getTokenSymbolFromAddress(tokenAddress as string, this.provider));

    let createInvoiceResult;
    switch (tokenType) {
      case TokenType.ETH:
        createInvoiceResult = await this.createForETH(
          invoice,
          contractWithSigner
        );
        break;
      case TokenType.ERC20:
        createInvoiceResult = await this.createForERC20(
          invoice,
          contractWithSigner
        );
        break;
      case TokenType.ERC721:
        createInvoiceResult = await this.createForERC721(
          invoice,
          contractWithSigner
        );
        break;
      default:
        throw new Error("Invalid token type");
    }

    const { invoiceId, txn } = createInvoiceResult;

    // TODO move to be called by redux?? hacky af
    LocalStorageClient.set(invoiceId, {
      id: invoiceId,
      date,
      dueDate,
      itemName,
      itemDescription,
      tokenSymbol: tokenType === TokenType.ETH ? "ETH" : invoiceTokenSymbol,
      milestones,
    });

    return createInvoiceResult;
  }

  private async createForETH(invoice: InvoiceCreate, contractWithSigner) {
    const { clientAddress, providerAddress, dueDate, amount, milestones } =
      invoice;
    const amountInWei = ethers.utils.parseEther(amount as string);
    const milestonesInWei = milestones?.length
      ? milestones.map((milestone) => ethers.utils.parseEther(milestone.amount))
      : null;
    const epochDueDate = Math.round(dueDate.getTime() / 1000);

    const txn = await contractWithSigner.createInvoice(
      clientAddress,
      providerAddress,
      ethers.constants.AddressZero,
      milestonesInWei ? milestonesInWei : [amountInWei],
      epochDueDate,
      false // isErc721
    );
    const receipt = await txn.wait();
    const invoiceId = receipt?.events[0]?.args?.id?.toNumber();

    return { txn, invoiceId };
  }

  private async createForERC20(invoice: InvoiceCreate, contractWithSigner) {
    const {
      clientAddress,
      providerAddress,
      dueDate,
      amount,
      tokenAddress,
      tokenSymbol,
      milestones,
    } = invoice;
    // 18 DECIMALS ASSUMED
    const amountInWei = ethers.utils.parseEther(amount as string);
    const milestonesInWei = milestones?.length
      ? milestones.map((milestone) => ethers.utils.parseEther(milestone.amount))
      : null;
    const epochDueDate = Math.round(dueDate.getTime() / 1000);
    const nonEthTokenAddress =
      tokenAddress || getTokenAddressFromSymbol(tokenSymbol as string);
    const txn = await contractWithSigner.createInvoice(
      clientAddress,
      providerAddress,
      nonEthTokenAddress,
      milestonesInWei ? milestonesInWei : [amountInWei],
      epochDueDate,
      false // isErc721
    );
    const receipt = await txn.wait();
    const invoiceId = receipt?.events[0]?.args?.id?.toNumber();

    return { txn, invoiceId };
  }

  private async createForERC721(invoice: InvoiceCreate, contractWithSigner) {
    const {
      clientAddress,
      providerAddress,
      dueDate,
      tokenId,
      tokenAddress,
      tokenSymbol,
    } = invoice;
    const epochDueDate = Math.round(dueDate.getTime() / 1000);
    const nonEthTokenAddress =
      tokenAddress || getTokenAddressFromSymbol(tokenSymbol as string);
    const txn = await contractWithSigner.createInvoice(
      clientAddress,
      providerAddress,
      nonEthTokenAddress,
      [tokenId],
      epochDueDate,
      true // isErc721
    );
    const receipt = await txn.wait();
    const invoiceId = receipt?.events[0]?.args?.id?.toNumber();

    return { txn, invoiceId };
  }

  async payInvoice(invoice: Invoice) {
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    const { tokenType } = invoice;
    switch (tokenType) {
      case TokenType.ETH:
        return this.payForETH(invoice, contractWithSigner);
      case TokenType.ERC20:
        return this.payForERC20(invoice, contractWithSigner);
      case TokenType.ERC721:
        return this.payForERC721(invoice, contractWithSigner);
    }
  }

  private async payForETH(invoice: Invoice, contractWithSigner) {
    const { id, amount } = invoice;
    const amountInWei = ethers.utils.parseEther(amount as string);
    const txn = await contractWithSigner.deposit(
      id,
      ethers.constants.AddressZero,
      [amountInWei],
      false, // isErc721
      { value: amountInWei }
    );
    await txn.wait();
    return txn;
  }

  async release(invoiceId: number, releaseUntil: number) {
    console.log({ invoiceId, releaseUntil });
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    const txn = await contractWithSigner.release(invoiceId, releaseUntil);
    await txn.wait();
    return txn;
  }

  private async payForERC20(invoice: Invoice, contractWithSigner) {
    const { id, amount, tokenAddress } = invoice;
    const amountInWei = ethers.utils.parseEther(amount as string);

    await this.erc20Approve(amountInWei, tokenAddress as string);

    const txn = await contractWithSigner.deposit(
      id,
      tokenAddress,
      [amountInWei],
      false // isErc721
    );
    await txn.wait();
    return txn;
  }

  private async payForERC721(invoice: Invoice, contractWithSigner) {
    const { id, tokenId, tokenAddress } = invoice;

    await this.erc721Approve(tokenId as number, tokenAddress as string);

    const txn = await contractWithSigner.deposit(
      id,
      tokenAddress,
      [tokenId],
      true // isErc721
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

  private async erc721Approve(tokenId: number, tokenAddress: string) {
    const signer = this.provider.getSigner();
    const tokenContract = new ethers.Contract(tokenAddress, ERC721, signer);
    const txn = await tokenContract.approve(this.contract.address, tokenId);
    await txn.wait();
    return txn;
  }
}
