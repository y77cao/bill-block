import React from "react";
import { Button, Alert } from "@mui/material";
import { useDispatch, connect } from "react-redux";
import { AppDispatch } from "@/redux/store";

import styles from "../styles/PageHeader.module.css";
import { connectWallet } from "@/redux/blockchainSlice";
import { clearAppError } from "@/redux/appSlice";

const PageHeader = ({ account, error }) => {
  const dispatch = useDispatch<AppDispatch>();
  return (
    <div className={styles.headerContainer}>
      <div className={styles.topContainer}>
        <div>BILLBLOCK</div>
        <Button
          variant="contained"
          onClick={() => {
            if (!account) dispatch(connectWallet());
          }}
        >
          {account ? account : "Connect Wallet"}
        </Button>
      </div>
      <div className={styles.alertContainer}>
        {error ? (
          <Alert severity="error" onClose={() => dispatch(clearAppError())}>
            {error}
          </Alert>
        ) : null}
      </div>
    </div>
  );
};

const mapStateToProps = (state, ownProps) => ({
  account: state.blockchain.account,
  error: state.app.errorMsg,
  ...ownProps,
});
export default connect(mapStateToProps)(PageHeader);
