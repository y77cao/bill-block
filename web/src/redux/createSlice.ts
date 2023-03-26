import { createSlice } from "@reduxjs/toolkit";
import { appError } from "./appSlice";
import { Invoice, InvoiceCreate } from "@/types";

const initialState = {
  loading: false,
  transaction: null,
  invoiceId: null,
};

export const createInvoiceSlice = createSlice({
  name: "create",
  initialState,
  reducers: {
    createInvoiceRequest: (state) => {
      state.loading = true;
    },
    createInvoiceSuccess: (state, action) => {
      state.loading = false;
      state.transaction = action.payload.transaction;
      state.invoiceId = action.payload.invoiceId;
    },
    clearTransaction: (state) => {
      state.transaction = null;
      state.invoiceId = null;
    },
    error: (state) => {
      state.loading = false;
    },
  },
});

export const {
  createInvoiceRequest,
  createInvoiceSuccess,
  error,
  clearTransaction,
} = createInvoiceSlice.actions;

export const createInvoice =
  (invoice: InvoiceCreate) => async (dispatch, getState) => {
    dispatch(createInvoiceRequest());
    try {
      const state = getState();
      const { contractClient } = state.account;
      const { txn, invoiceId } = await contractClient.createInvoice(invoice);
      dispatch(
        createInvoiceSuccess({
          transaction: txn,
          invoiceId,
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

export default createInvoiceSlice.reducer;
