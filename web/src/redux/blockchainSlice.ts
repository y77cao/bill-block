import { createSlice } from "@reduxjs/toolkit";
import { ContractClient } from "../clients/contractClient";
import { ethers, BigNumber } from "ethers";

const initialState = {
  loading: false,
  account: null,
  contractClient: null,
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
    checkBalanceRequest: (state) => {
      state.loading = true;
    },
    checkBalanceSuccess: (state, action) => {
      state.loading = false;
    },
    withdrawFundRequest: (state) => {
      state.loading = true;
    },
    withdrawFundSuccess: (state, action) => {
      state.loading = false;
      //@ts-ignore
      state.tokenIdWithBalance.balance = BigNumber.from(0);
    },
    previewMintRequest: (state) => {
      state.loading = true;
    },
    previewMintSuccess: (state, action) => {
      state.loading = false;
    },
    mintRequest: (state) => {
      state.loading = true;
    },
    mintSuccess: (state, action) => {
      state.loading = false;
    },
    clearTransaction: (state) => {},
    error: (state) => {
      state.loading = false;
    },
    updateAccountRequest: (state) => {
      state.loading = true;
    },
    updateAccountSuccess: (state, action) => {
      state.account = action.payload.account;
    },
  },
});

export const {
  initSuccess,
  connectRequest,
  connectSuccess,
  fetchDataRequest,
  fetchDataSuccess,
  checkBalanceRequest,
  checkBalanceSuccess,
  withdrawFundRequest,
  withdrawFundSuccess,
  previewMintRequest,
  previewMintSuccess,
  mintRequest,
  mintSuccess,
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

export const connect = () => async (dispatch, getState) => {
  dispatch(connectRequest());
  try {
    const state = getState();
    const account = await ContractClient.connectWallet();
    dispatch(connectSuccess({ account }));
  } catch (err) {
    dispatch(error());
    // dispatch(appError(err.message));
  }
};

// export const updateAccountMetadata =
//   (account) => async (dispatch, getState) => {
//     dispatch(updateAccountRequest());
//     try {
//       const state = getState();
//       const { contractClient, stories } = state.blockchain;
//       const numberOfOwnedTokens = (
//         await contractClient.getNumberOfOwnedTokens(account)
//       ).toNumber();
//       const nextTokenId = Object.values(stories).flat().length;
//       const canMintWithTitle = await contractClient.canMintWithTitle(
//         BigNumber.from(nextTokenId),
//         account
//       );
//       dispatch(
//         updateAccountSuccess({ account, numberOfOwnedTokens, canMintWithTitle })
//       );
//     } catch (err) {
//       dispatch(error());
//       dispatch(appError(err.message));
//     }
//   };

// export const mint =
//   (text: string, parentId: number) => async (dispatch, getState) => {
//     dispatch(mintRequest());
//     try {
//       const state = getState();
//       const { contractClient } = state.blockchain;
//       const txn = await contractClient.mint(text, parentId);
//       dispatch(
//         mintSuccess({
//           transaction: txn,
//         })
//       );
//     } catch (err) {
//       dispatch(error());
//       dispatch(appError(err.message));
//     }
//   };

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

// export const checkBalance = (tokenId) => async (dispatch, getState) => {
//   dispatch(checkBalanceRequest());
//   try {
//     const state = getState();
//     const { contractClient } = state.blockchain;
//     const balance = await contractClient.getBalanceOf(BigNumber.from(tokenId));
//     dispatch(checkBalanceSuccess({ tokenId, balance }));
//   } catch (err) {
//     dispatch(error());
//     dispatch(appError(err.message));
//   }
// };

// export const withdrawFund =
//   (tokenId, balance) => async (dispatch, getState) => {
//     dispatch(withdrawFundRequest());
//     try {
//       const state = getState();
//       const { contractClient } = state.blockchain;
//       const txn = await contractClient.withdraw(tokenId, balance);
//       dispatch(
//         withdrawFundSuccess({
//           transaction: txn,
//         })
//       );
//     } catch (err) {
//       dispatch(error());
//       dispatch(appError(err.message));
//     }
//   };

// export const previewMint =
//   (text, creator, title) => async (dispatch, getState) => {
//     dispatch(previewMintRequest());
//     try {
//       const state = getState();
//       const { contractClient } = state.blockchain;
//       const svgString = await contractClient.generateSvg(text, creator, title);
//       dispatch(
//         previewMintSuccess({
//           svgString,
//         })
//       );
//     } catch (err) {
//       dispatch(error());
//       dispatch(appError(err.message));
//     }
//   };

export default blockchainSlice.reducer;
