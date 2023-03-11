import React from "react";
import Button from "@mui/material/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";

import styles from "../styles/PageHeader.module.css";
import { connect } from "@/redux/blockchainSlice";

export const PageHeader = () => {
  const dispatch = useDispatch<AppDispatch>();
  // @ts-ignore
  const blockchain = useSelector((state) => state.blockchain);

  return (
    <div className={styles.headerContainer}>
      <div>BillBlock</div>
      <Button
        variant="contained"
        onClick={() => {
          if (!blockchain.account) dispatch(connect());
        }}
      >
        {blockchain.account ? blockchain.account : "Connect Wallet"}
      </Button>
    </div>
  );
};
