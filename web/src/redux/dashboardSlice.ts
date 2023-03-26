import { createSlice } from "@reduxjs/toolkit";
import { appError } from "./appSlice";
import { Invoice } from "@/types";
import { parseInvoices } from "@/utils";
import { ethers } from "ethers";

export enum ActionType {
  PAY = "pay",
  RELEASE = "release",
}

type State = {
  loading: boolean;
  actionType: ActionType | null;
  transaction: ethers.Transaction | null;
  invoicesByProvider: Invoice[];
  invoicesByClient: Invoice[];
};

const initialState: State = {
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

export const getInvoices = (address?: string) => async (dispatch, getState) => {
  dispatch(getInvoicesRequest());
  try {
    const state = getState();
    const { contractClient, account } = state.account;
    const invoicesByProvider = await contractClient.getInvoicesByProvider(
      address || account
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
    if (err instanceof Error) {
      dispatch(error());
      dispatch(appError(err.message));
    }

    throw err;
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
    if (err instanceof Error) {
      dispatch(error());
      dispatch(appError(err.message));
    }

    throw err;
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
      if (err instanceof Error) {
        dispatch(error());
        dispatch(appError(err.message));
      }

      throw err;
    }
  };

export default dashboardSlice.reducer;
