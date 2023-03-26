import { createSlice } from "@reduxjs/toolkit";
import { appError } from "./appSlice";
import { Invoice } from "@/types";
import { ContractClient } from "@/clients/contractClient";
import { initSuccess } from "./accountSlice";
import { parseInvoices } from "@/utils";
import { ethers } from "ethers";

type State = {
  loading: boolean;
  transaction: ethers.Transaction | null;
  invoice: Invoice | null;
  contractClient: typeof ContractClient | null;
};

const initialState: State = {
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
      })
    );
    dispatch(
      initSuccess({
        contractClient,
        account,
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

export default paySlice.reducer;
