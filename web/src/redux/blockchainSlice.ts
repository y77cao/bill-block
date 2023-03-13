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
  invoices: [],
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
    getInvoicesByProviderRequest: (state) => {
      state.loading = true;
    },
    getInvoicesByProviderSuccess: (state, action) => {
      state.loading = false;
      state.invoices = action.payload.invoices;
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
      state.invoices = action.payload.invoices;
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
  getInvoicesByProviderRequest,
  getInvoicesByProviderSuccess,
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
    dispatch(getInvoicesByProvider(account));
  } catch (err) {
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export const getInvoicesByProvider =
  (address) => async (dispatch, getState) => {
    dispatch(getInvoicesByProviderRequest());
    try {
      const state = getState();
      const { contractClient } = state.blockchain;
      const invoices = await contractClient.getInvoicesByProvider(address);
      const parsedInvoices = parseInvoices(invoices);
      dispatch(getInvoicesByProviderSuccess({ invoices: parsedInvoices }));
    } catch (err) {
      dispatch(error());
      dispatch(appError(err.message));
    }
  };

export const updateAccountData = (newAccount) => async (dispatch, getState) => {
  dispatch(updateAccountRequest());
  try {
    const state = getState();
    const { contractClient, account } = state.blockchain;

    const invoices = account
      ? await contractClient.getInvoicesByProvider(account)
      : [];
    const parsedInvoices = parseInvoices(invoices);
    dispatch(
      updateAccountSuccess({ account: newAccount, invoices: parsedInvoices })
    );
  } catch (err) {
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export const createInvoice = (invoice) => async (dispatch, getState) => {
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

export const payInvoice =
  ({ invoiceId, amounts, token, isErc721 }) =>
  async (dispatch, getState) => {
    dispatch(payInvoiceRequest());
    try {
      const state = getState();
      const { contractClient } = state.blockchain;
      const txn = await contractClient.payInvoice({
        invoiceId,
        amounts,
        token,
        isErc721,
      });
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
