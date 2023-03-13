import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Collapse,
  Modal,
} from "@mui/material";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

import {
  clearTransaction,
  getInvoicesByProvider,
  init,
  payInvoice,
  updateAccountData,
} from "../redux/blockchainSlice";
import styles from "@/styles/dashboard.module.css";
import PageHeader from "@/components/PageHeader";
import { AppDispatch } from "@/redux/store";
import { Invoice } from "@/types";

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const blockchain = useSelector((state) => state.blockchain);

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

  const Row = (props: { row: Invoice }) => {
    const { row } = props;
    const [open, setOpen] = React.useState(false);

    return (
      <React.Fragment>
        <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
          <TableCell>
            <IconButton
              aria-label="expand row"
              size="small"
              onClick={() => setOpen(!open)}
            >
              {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </TableCell>
          <TableCell component="th" scope="row">
            {row.id}
          </TableCell>
          <TableCell>{row.itemName}</TableCell>
          <TableCell>
            {row.amount.toString()} {row.currency}
          </TableCell>
          <TableCell>{row.status}</TableCell>
          <TableCell>
            <Button
              variant="contained"
              onClick={() =>
                dispatch(
                  payInvoice({
                    invoiceId: row.id,
                    amounts: [row.amount], // TODO milestones
                    token: row.token,
                    isErc721: false, // TODO
                  })
                )
              }
            >
              Pay
            </Button>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <div>hi</div>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  };

  //   const onClickPay = () => {
  //     dispatch(payInvoice({}));
  //   };

  return (
    <div>
      <PageHeader />
      <div className={styles.dashboardContainer}>
        <Paper elevation={3} square className={styles.dashboardInnerContainer}>
          <div className={styles.dashboardHeader}>Invoices</div>
          <TableContainer>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {blockchain.invoices.map((row) => (
                  <Row key={row.id} row={row} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </div>
      <Modal
        open={blockchain.transaction != null}
        onClose={() => dispatch(clearTransaction())}
      >
        <div className={styles.modalContainer}>
          <>Invoice paid successfully!</>
          <div className={styles.buttonContainer}>
            <Button
              variant="contained"
              onClick={() => dispatch(clearTransaction())}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
