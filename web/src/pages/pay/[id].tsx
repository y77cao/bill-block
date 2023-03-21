import { useRouter } from "next/router";

import React from "react";

import { useEffect } from "react";
import styles from "@/styles/pay.module.css";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import {
  Paper,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { initPay } from "@/redux/paySlice";
import Grid from "@mui/material/Unstable_Grid2";
import { LoadingButton } from "@mui/lab";
import { InvoiceStatus, TokenType } from "@/types";

const Pay = () => {
  const router = useRouter();
  const { id } = router.query;

  const dispatch = useDispatch<AppDispatch>();
  const pay = useSelector((state) => state.pay);

  useEffect(() => {
    dispatch(initPay(Number(id)));
    // @ts-ignore checked in init
    const { ethereum } = window;

    ethereum?.on("chainChanged", (chainId) => {
      window.location.reload();
      dispatch(initPay(Number(id)));
    });
  }, [id]);

  const { invoice, loading } = pay;

  const getAmount = () => {
    return invoice.tokenType === TokenType.ERC721
      ? `${invoice.tokenSymbol} #${invoice.tokenId}`
      : `${invoice.amount} ${
          invoice.tokrnType === TokenType.ETH ? "ETH" : invoice.tokenSymbol
        }`;
  };

  if (!invoice) return <div>loading...</div>;
  return (
    <div>
      <div className={styles.payContainer}>
        <Paper elevation={10} className={styles.invoiceContainer}>
          <div className={styles.invoiceTitle}>INVOICE #{invoice.id}</div>
          <div className={styles.invoiceTop}>
            <div className={styles.invoiceTopLeft}>
              <Grid container rowSpacing={2} columns={{ xs: 10 }}>
                <Grid xs={2}>
                  <div>Provider Address:</div>
                </Grid>
                <Grid xs={8}>
                  <div>{invoice.providerAddress}</div>
                </Grid>
                <Grid xs={2}>
                  <div>Client Address: </div>
                </Grid>
                <Grid xs={8}>
                  <div>{invoice.clientAddress}</div>
                </Grid>
                <Grid xs={2}>
                  <div>Created At:</div>
                </Grid>
                <Grid xs={8}>
                  <div>{invoice.date}</div>
                </Grid>
                <Grid xs={2}>
                  <div>Due At:</div>
                </Grid>
                <Grid xs={8}>
                  <div>{invoice.dueDate}</div>
                </Grid>
                <Grid xs={2}>
                  <div>Status:</div>
                </Grid>
                <Grid xs={8}>
                  <div>{InvoiceStatus[invoice.status]}</div>
                </Grid>
              </Grid>
            </div>
          </div>

          <Divider />
          <div className={styles.itemContainer}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>{invoice.itemName}</TableCell>
                    <TableCell>
                      {invoice.itemDescription.length
                        ? invoice.itemDescription
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {invoice.milestones.length ? null : getAmount()}
                    </TableCell>
                  </TableRow>
                  {invoice.milestones.map((milestone, index) => {
                    return (
                      <TableRow
                        key={index}
                        sx={{ borderStyle: "hidden!important" }}
                      >
                        <TableCell></TableCell>
                        <TableCell>{milestone.name}</TableCell>
                        <TableCell>
                          {`${milestone.amount} ${
                            invoice.tokenType === TokenType.ETH
                              ? "ETH"
                              : invoice.tokenSymbol
                          }`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ borderStyle: "hidden!important" }}>
                    <TableCell></TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>{getAmount()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <Divider />
          <div className={styles.payInvoiceContainer}>
            <div>
              <LoadingButton variant="contained" fullWidth>
                Pay Invoice
              </LoadingButton>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default Pay;
