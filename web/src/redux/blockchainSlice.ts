import { createSlice } from "@reduxjs/toolkit";
import { ContractClient } from "../clients/contractClient";
import { ethers, BigNumber } from "ethers";
import { appError } from "./appSlice";
import { Invoice } from "@/types";
import { parseInvoices } from "@/utils";

const initialState = {
  loading: false,
  account: null,
  contractClient: null,
  transaction: null,
  invoicesByProvider: [],
  invoicesByClient: [],
};

export const blockchainSlice = createSlice({
  name: "blockchain",
  initialState,
  reducers: {
    initSuccess: (state, action) => {
      state.contractClient = action.payload.contractClient;
    },
    connectRequest: (state) => {
      state.loading = true;
    },
    connectSuccess: (state, action) => {
      state.loading = false;
      state.account = action.payload.account;
    },
    fetchDataRequest: (state) => {
      state.loading = true;
    },
    fetchDataSuccess: (state, action) => {
      state.loading = false;
    },
    payInvoiceRequest: (state) => {
      state.loading = true;
    },
    payInvoiceSuccess: (state, action) => {
      state.loading = false;
      state.transaction = action.payload.transaction;
    },
    getInvoicesRequest: (state) => {
      state.loading = true;
    },
    getInvoicesSuccess: (state, action) => {
      state.loading = false;
      state.invoicesByProvider = action.payload.invoicesByProvider;
      state.invoicesByClient = action.payload.invoicesByClient;
    },
    createInvoiceRequest: (state) => {
      state.loading = true;
    },
    createInvoiceSuccess: (state, action) => {
      state.loading = false;
      state.transaction = action.payload.transaction;
    },
    clearTransaction: (state) => {
      state.transaction = null;
    },
    error: (state) => {
      state.loading = false;
    },
    updateAccountRequest: (state) => {
      state.loading = true;
    },
    updateAccountSuccess: (state, action) => {
      state.loading = false;
      state.account = action.payload.account;
      state.invoicesByClient = action.payload.invoicesByClient;
      state.invoicesByProvider = action.payload.invoicesByProvider;
    },
  },
});

export const {
  initSuccess,
  connectRequest,
  connectSuccess,
  fetchDataRequest,
  fetchDataSuccess,
  payInvoiceRequest,
  payInvoiceSuccess,
  getInvoicesRequest,
  getInvoicesSuccess,
  createInvoiceRequest,
  createInvoiceSuccess,
  error,
  clearTransaction,
  updateAccountRequest,
  updateAccountSuccess,
} = blockchainSlice.actions;

export const init = () => async (dispatch) => {
  try {
    const { provider, contract } = await ContractClient.initContract();
    const contractClient = new ContractClient(provider, contract);
    dispatch(initSuccess({ contractClient }));
    // dispatch(fetchData());
  } catch (err) {
    // dispatch(appError(err.message));
  }
};

export const connectWallet = () => async (dispatch, getState) => {
  dispatch(connectRequest());
  try {
    const state = getState();
    const account = await ContractClient.connectWallet();
    dispatch(connectSuccess({ account }));
    dispatch(getInvoices(account));
  } catch (err) {
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export const getInvoices = (address) => async (dispatch, getState) => {
  dispatch(getInvoicesRequest());
  try {
    const state = getState();
    const { contractClient } = state.blockchain;
    const invoicesByProvider = await contractClient.getInvoicesByProvider(
      address
    );
    const invoicesByClient = await contractClient.getInvoicesByClient(address);
    const parsedInvoicesByProvider = await parseInvoices(invoicesByProvider);
    const parsedInvoicesByClient = await parseInvoices(invoicesByClient);

    dispatch(
      getInvoicesSuccess({
        invoicesByProvider: parsedInvoicesByProvider,
        invoicesByClient: parsedInvoicesByClient,
      })
    );
  } catch (err) {
    console.log(err);
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export const updateAccountData = (newAccount) => async (dispatch, getState) => {
  dispatch(updateAccountRequest());
  try {
    const state = getState();
    const { contractClient, account } = state.blockchain;

    const invoicesByProvider = account
      ? await contractClient.getInvoicesByProvider(account)
      : [];
    const invoicesByClient = account
      ? await contractClient.getInvoicesByClient(account)
      : [];
    const parsedInvoicesByProvider = await parseInvoices(invoicesByProvider);
    const parsedInvoicesByClient = await parseInvoices(invoicesByClient);
    dispatch(
      updateAccountSuccess({
        account: newAccount,
        invoicesByProvider: parsedInvoicesByProvider,
        invoicesByClient: parsedInvoicesByClient,
      })
    );
  } catch (err) {
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export const createInvoice =
  (invoice: Invoice) => async (dispatch, getState) => {
    dispatch(createInvoiceRequest());
    try {
      const state = getState();
      const { contractClient } = state.blockchain;
      const txn = await contractClient.createInvoice(invoice);
      dispatch(
        createInvoiceSuccess({
          transaction: txn,
        })
      );
    } catch (err) {
      dispatch(error());
      dispatch(appError(err.message));
    }
  };

export const payInvoice = (invoice: Invoice) => async (dispatch, getState) => {
  dispatch(payInvoiceRequest());
  try {
    const state = getState();
    const { contractClient } = state.blockchain;
    const txn = await contractClient.payInvoice(invoice);
    dispatch(
      payInvoiceSuccess({
        transaction: txn,
      })
    );
  } catch (err) {
    dispatch(error());
    dispatch(appError(err.message));
  }
};

// export const fetchData = () => async (dispatch, getState) => {
//   dispatch(fetchDataRequest());
//   try {
//     const state = getState();
//     const { contractClient, account } = state.blockchain;
//     const pricePerChar = await contractClient.getPricePerChar();
//     const tokens = await contractClient.getAllTokens();
//     const canMintWithTitle = account
//       ? await contractClient.canMintWithTitle(
//           BigNumber.from(tokens.length),
//           account
//         )
//       : false;
//     const stories = toStories(tokens);
//     const numberOfOwnedTokens = account
//       ? (await contractClient.getNumberOfOwnedTokens(account)).toNumber()
//       : null;
//     dispatch(
//       fetchDataSuccess({
//         stories,
//         pricePerChar,
//         numberOfOwnedTokens,
//         canMintWithTitle,
//       })
//     );
//   } catch (err) {
//     dispatch(error());
//     dispatch(appError(err.message));
//   }
// };

export default blockchainSlice.reducer;
