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
      process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
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

  async mint(text: string, parentId: number) {
    if (!text || !text.length || text.length > 280) {
      throw new Error("Invalid text length");
    }
    const signer = this.provider.getSigner();
    const contractWithSigner = this.contract.connect(signer);
    const txn = await contractWithSigner.mint(text, parentId, {
      value: 0,
    });
    await txn.wait();
    return txn;
  }
}
