import { createSlice } from "@reduxjs/toolkit";
import { appError } from "./appSlice";
import { Invoice } from "@/types";
import { ContractClient } from "@/clients/contractClient";
import { parseInvoices } from "@/utils";

const initialState = {
  loading: false,
  transaction: null,
  invoice: null,
  contractClient: null,
};

export const paySlice = createSlice({
  name: "pay",
  initialState,
  reducers: {
    payInitRequest: (state) => {
      state.loading = true;
    },
    payInitSuccess: (state, action) => {
      state.loading = false;
      state.invoice = action.payload.invoice;
    },
    clearTransaction: (state) => {
      state.transaction = null;
    },
    error: (state) => {
      state.loading = false;
    },
  },
});

export const { payInitRequest, payInitSuccess, error, clearTransaction } =
  paySlice.actions;

export const initPay = (invoiceId: number) => async (dispatch, getState) => {
  dispatch(payInitRequest());
  try {
    const { provider, contract, account } = await ContractClient.initContract();
    const contractClient = new ContractClient(provider, contract);
    const invoice = await contractClient.getInvoiceById(invoiceId);
    const parsedInvoices = await parseInvoices([invoice]);
    dispatch(
      payInitSuccess({
        invoice: parsedInvoices[0],
        contractClient,
      })
    );
  } catch (err) {
    console.log(err);
    dispatch(error());
    dispatch(appError(err.message));
  }
};

export default paySlice.reducer;
