import { createSlice } from "@reduxjs/toolkit";
import { ContractClient } from "../clients/contractClient";
import { appError } from "./appSlice";
import { parseInvoices } from "@/utils";
import { getInvoices } from "./dashboardSlice";

const initialState = {
  loading: false,
  account: null,
  contractClient: null,
  transaction: null,
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    initSuccess: (state, action) => {
      state.contractClient = action.payload.contractClient;
      state.account = action.payload.account;
    },
    connectRequest: (state) => {
      state.loading = true;
    },
    connectSuccess: (state, action) => {
      state.loading = false;
      state.account = action.payload.account;
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
    },
  },
});

export const {
  initSuccess,
  connectRequest,
  connectSuccess,
  error,
  updateAccountRequest,
  updateAccountSuccess,
} = accountSlice.actions;

export const init = () => async (dispatch) => {
  try {
    const { provider, contract, account } = await ContractClient.initContract();
    const contractClient = new ContractClient(provider, contract);
    dispatch(initSuccess({ contractClient, account }));
    if (account) dispatch(getInvoices(account));
  } catch (err) {
    dispatch(appError(err.message));
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

export const updateAccountData = (newAccount) => async (dispatch, getState) => {
  dispatch(updateAccountRequest());
  try {
    const state = getState();

    dispatch(getInvoices(newAccount));
    dispatch(
      updateAccountSuccess({
        account: newAccount,
      })
    );
  } catch (err) {
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export default accountSlice.reducer;
