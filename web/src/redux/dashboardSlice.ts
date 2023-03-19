import { createSlice } from "@reduxjs/toolkit";
import { ContractClient } from "../clients/contractClient";
import { ethers, BigNumber } from "ethers";
import { appError } from "./appSlice";
import { Invoice } from "@/types";
import { parseInvoices } from "@/utils";

export enum ActionType {
  PAY = "pay",
  RELEASE = "release",
}

const initialState = {
  loading: false,
  actionType: null,
  transaction: null,
  invoicesByProvider: [],
  invoicesByClient: [],
};

export const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    payInvoiceRequest: (state) => {
      state.loading = true;
    },
    payInvoiceSuccess: (state, action) => {
      state.loading = false;
      state.transaction = action.payload.transaction;
      state.actionType = ActionType.PAY;
    },
    getInvoicesRequest: (state) => {
      state.loading = true;
    },
    getInvoicesSuccess: (state, action) => {
      state.loading = false;
      state.invoicesByProvider = action.payload.invoicesByProvider;
      state.invoicesByClient = action.payload.invoicesByClient;
    },
    releaseFundRequest: (state) => {
      state.loading = true;
    },
    releaseFundSuccess: (state, action) => {
      state.loading = false;
      state.transaction = action.payload.transaction;
      state.actionType = ActionType.RELEASE;
    },
    clearTransaction: (state) => {
      state.transaction = null;
      state.actionType = null;
    },
    error: (state) => {
      state.loading = false;
    },
  },
});

export const {
  payInvoiceRequest,
  payInvoiceSuccess,
  getInvoicesRequest,
  getInvoicesSuccess,
  releaseFundRequest,
  releaseFundSuccess,
  error,
  clearTransaction,
} = dashboardSlice.actions;

export const getInvoices = (address) => async (dispatch, getState) => {
  dispatch(getInvoicesRequest());
  try {
    const state = getState();
    const { contractClient } = state.account;
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

export const payInvoice = (invoice: Invoice) => async (dispatch, getState) => {
  dispatch(payInvoiceRequest());
  try {
    const state = getState();
    const { contractClient } = state.account;
    const txn = await contractClient.payInvoice(invoice);
    dispatch(
      payInvoiceSuccess({
        transaction: txn,
      })
    );
  } catch (err) {
    console.log(err);
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export const releaseFund =
  (invoiceId: number, releaseUntil: number) => async (dispatch, getState) => {
    dispatch(releaseFundRequest());
    try {
      const state = getState();
      const { contractClient } = state.account;
      const txn = await contractClient.release(invoiceId, releaseUntil);
      dispatch(
        releaseFundSuccess({
          transaction: txn,
        })
      );
    } catch (err) {
      console.log(err);
      dispatch(error());
      dispatch(appError(err.message));
    }
  };

export default dashboardSlice.reducer;
