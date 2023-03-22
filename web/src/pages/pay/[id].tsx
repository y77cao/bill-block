import { useRouter } from "next/router";

import React, { useState } from "react";

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
  Checkbox,
} from "@mui/material";
import { initPay } from "@/redux/paySlice";
import Grid from "@mui/material/Unstable_Grid2";
import { LoadingButton } from "@mui/lab";
import { Invoice, InvoiceStatus, TokenType } from "@/types";
import { InvoiceStatusPill } from "@/components/InvoiceStatusPill";
import { ReleaseFundModal } from "@/components/ReleaseFundModal";
import { PayModal } from "@/components/PayModal";

const Pay = () => {
  const router = useRouter();
  const { id } = router.query;

  const dispatch = useDispatch<AppDispatch>();
  const pay = useSelector((state) => state.pay);

  const [openModal, setOpenModal] = useState<boolean>(false);

  useEffect(() => {
    dispatch(initPay(Number(id)));
    // @ts-ignore checked in init
    const { ethereum } = window;

    ethereum?.on("chainChanged", (chainId) => {
      window.location.reload();
      dispatch(initPay(Number(id)));
    });
  }, [id]);

  const getActionComponent = (invoice: Invoice) => {
    switch (invoice.status) {
      case InvoiceStatus.CREATED:
        return (
          <PayModal
            invoice={invoice}
            open={openModal}
            onClose={() => {
              setOpenModal(false);
              dispatch(initPay(Number(id)));
            }}
          />
        );
      case InvoiceStatus.FUNDED:
      case InvoiceStatus.PARTIALLY_PAID:
        return (
          <ReleaseFundModal
            invoice={invoice}
            open={openModal}
            onClose={() => {
              setOpenModal(false);
              dispatch(initPay(Number(id)));
            }}
          />
        );
      case InvoiceStatus.PAID:
      case InvoiceStatus.TERMINATED:
        return null;
    }
  };

  const getActionButton = (invoice: Invoice, own: boolean) => {
    const { status } = invoice;
    if (own) {
      return null;
    }
    switch (status) {
      case InvoiceStatus.CREATED:
        return [
          // eslint-disable-next-line react/jsx-key
          <div>
            <LoadingButton
              variant="contained"
              fullWidth
              onClick={() => setOpenModal(true)}
            >
              Pay With Metamask
            </LoadingButton>
          </div>,
          // eslint-disable-next-line react/jsx-key
          <div>
            <LoadingButton variant="contained" fullWidth>
              Pay With Credit Card
            </LoadingButton>
          </div>,
        ];
      case InvoiceStatus.FUNDED:
      case InvoiceStatus.PARTIALLY_PAID:
        return (
          <LoadingButton
            variant="contained"
            onClick={() => setOpenModal(true)}
            sx={{ margin: "10px 0 0 0" }}
          >
            Release Fund
          </LoadingButton>
        );
      case InvoiceStatus.PAID:
      case InvoiceStatus.TERMINATED:
        return null;
    }
  };

  const { invoice, loading } = pay;

  const getAmount = (amount) => {
    return invoice.tokenType === TokenType.ERC721
      ? `${invoice.tokenSymbol} #${invoice.tokenId}`
      : `${amount} ${
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
                  <div>
                    <InvoiceStatusPill status={invoice.status} />
                  </div>
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
                    <TableCell sx={{ fontWeight: "bold" }}>Item Name</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Description
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Amount</TableCell>
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
                      {invoice.milestones.length
                        ? null
                        : getAmount(invoice.amount)}
                    </TableCell>
                  </TableRow>
                  {invoice.milestones.map((milestone, index) => {
                    return (
                      <TableRow
                        key={index}
                        sx={{ borderStyle: "hidden!important" }}
                      >
                        <TableCell></TableCell>
                        <TableCell
                          sx={
                            index < invoice.currMilestone
                              ? { textDecoration: "line-through" }
                              : null
                          }
                        >
                          {milestone.name}
                        </TableCell>
                        <TableCell
                          sx={
                            index < invoice.currMilestone
                              ? { textDecoration: "line-through" }
                              : null
                          }
                        >
                          {`${milestone.amount} ${
                            invoice.tokenType === TokenType.ETH
                              ? "ETH"
                              : invoice.tokenSymbol
                          }`}
                          {index < invoice.currMilestone ? (
                            <Checkbox
                              checked
                              size="small"
                              color="success"
                              sx={{ padding: "0 5px" }}
                            />
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow sx={{ borderStyle: "hidden!important" }}>
                    <TableCell></TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {getAmount(invoice.amount)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ borderStyle: "hidden!important" }}>
                    <TableCell></TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      Amount Due
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {getAmount(invoice.amountDue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </div>

          <Divider />
          <div className={styles.payInvoiceContainer}>
            {getActionButton(invoice, false)}
          </div>
          {getActionComponent(invoice)}
        </Paper>
      </div>
    </div>
  );
};

export default Pay;
