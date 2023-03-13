import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";

import { init, updateAccountData } from "../redux/blockchainSlice";
import styles from "../styles/index.module.css";
import PageHeader from "@/components/PageHeader";

export default function Home() {
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  // @ts-ignore
  const blockchain = useSelector((state) => state.blockchain);
  // @ts-ignore
  const app = useSelector((state) => state.app);

  useEffect(() => {
    dispatch(init());

    // @ts-ignore checked in init
    const { ethereum } = window;
    ethereum?.on("accountsChanged", (accounts) =>
      dispatch(updateAccountData(accounts[0]))
    );
    ethereum?.on("chainChanged", (chainId) => {
      window.location.reload();
      dispatch(init());
    });
  }, []);

  return (
    <div className={styles.main}>
      <PageHeader />
      <div className={styles.contentContainer}>
        <div className={styles.buttonContainer}>
          <Button variant="contained" onClick={() => router.push("/create")}>
            Create an Invoice
          </Button>
          <Button variant="contained" onClick={() => router.push("/pay")}>
            Pay an Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
