import { configureStore } from "@reduxjs/toolkit";
import blockchainReducer from "./blockchainSlice";
import appReducer from "./appSlice";

export const store = configureStore({
  reducer: {
    blockchain: blockchainReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type
export type AppDispatch = typeof store.dispatch;
