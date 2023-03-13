import { Invoice } from "@/types";
import { ethers, BigNumber } from "ethers";
import InvoiceFactory from "../abi/InvoiceFactory.json";

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
      token,
      amount,
      currency,
      tokenAddress,
      milestones,
      isErc721,
    } = invoice;
    const amountInWei = ethers.utils.parseEther(amount);
    const epochDate = Math.round(dueDate.getTime() / 1000);
    const epochDueDate = Math.round(dueDate.getTime() / 1000);

    const txn = await contractWithSigner.createInvoice(
      clientAddress,
      providerAddress,
      ethers.constants.AddressZero,
      [amountInWei],
      epochDueDate,
      isErc721
    );
    await txn.wait();
    return txn;
  }

  async payInvoice({ invoiceId, amounts, token, isErc721 }) {
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);

    const amountsInWei = amounts.map((amount) =>
      ethers.utils.parseEther(amount)
    );

    // TODO: handle erc721, ERC20
    const txn = await contractWithSigner.deposit(
      invoiceId,
      ethers.constants.AddressZero,
      amountsInWei,
      isErc721,
      { value: amountsInWei[0] }
    );
    await txn.wait();
    return txn;
  }
}
