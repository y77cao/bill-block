import React from "react";
import { Button, Alert } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";

import styles from "../styles/PageHeader.module.css";
import { connect } from "@/redux/blockchainSlice";
import { clearAppError } from "@/redux/appSlice";

export const PageHeader = () => {
  const dispatch = useDispatch<AppDispatch>();
  // @ts-ignore
  const blockchain = useSelector((state) => state.blockchain);
  const app = useSelector((state) => state.app);

  return (
    <div className={styles.headerContainer}>
      <div className={styles.topContainer}>
        <div>BILLBLOCK</div>
        <Button
          variant="contained"
          onClick={() => {
            if (!blockchain.account) dispatch(connect());
          }}
        >
          {blockchain.account ? blockchain.account : "Connect Wallet"}
        </Button>
      </div>
      <div className={styles.alertContainer}>
        {app.errorMsg ? (
          <Alert severity="error" onClose={() => dispatch(clearAppError())}>
            {app.errorMsg}
          </Alert>
        ) : null}
      </div>
    </div>
  );
};
