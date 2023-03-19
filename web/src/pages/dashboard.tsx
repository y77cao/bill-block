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
  Modal,
  Box,
  Tab,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

import {
  ActionType,
  clearTransaction,
  payInvoice,
} from "@/redux/dashboardSlice";
import { init, updateAccountData } from "@/redux/accountSlice";
import styles from "@/styles/dashboard.module.css";
import PageHeader from "@/components/PageHeader";
import { AppDispatch } from "@/redux/store";
import { Invoice, InvoiceStatus, TokenType } from "@/types";
import { ReleaseFundModal } from "@/components/ReleaseFundModal";

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector((state) => state.dashboard);

  const [tabValue, setTabValue] = useState("1");

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

  const Row = (props: { row: Invoice; own: boolean }) => {
    const { row, own } = props;
    const [open, setOpen] = React.useState(false);
    const [openModal, setOpenModal] = React.useState(false);

    const getActionComponent = () => {
      switch (row.status) {
        case InvoiceStatus.CREATED:
          return <></>;
        case InvoiceStatus.FUNDED:
        case InvoiceStatus.PARTIALLY_PAID:
          return (
            <ReleaseFundModal
              invoice={row}
              open={openModal}
              onClose={() => setOpenModal(false)}
            />
          );
        case InvoiceStatus.PAID:
        case InvoiceStatus.TERMINATED:
          return <></>;
      }
    };

    const getActionButton = (invoice: Invoice, own: boolean) => {
      const { status } = invoice;
      if (own) {
        return (
          <Button variant="contained" onClick={() => {}}>
            View
          </Button>
        );
      }
      switch (status) {
        case InvoiceStatus.CREATED:
          return (
            <Button
              variant="contained"
              onClick={() => dispatch(payInvoice(invoice))}
            >
              Pay
            </Button>
          );
        case InvoiceStatus.FUNDED:
        case InvoiceStatus.PARTIALLY_PAID:
          return (
            <Button variant="contained" onClick={() => setOpenModal(true)}>
              Release Fund
            </Button>
          );
        case InvoiceStatus.PAID:
        case InvoiceStatus.TERMINATED:
          return (
            <Button variant="contained" onClick={() => {}}>
              View
            </Button>
          );
      }
    };

    return (
      <React.Fragment>
        <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
          <TableCell component="th" scope="row">
            {row.id}
          </TableCell>
          <TableCell>{row.itemName}</TableCell>
          <TableCell>
            {row.tokenType === TokenType.ERC721 ? "1" : row.amount.toString()}{" "}
            {row.tokenSymbol}
          </TableCell>
          <TableCell>{InvoiceStatus[row.status as number]}</TableCell>
          <TableCell>{getActionButton(row, own)}</TableCell>
        </TableRow>
        {getActionComponent()}
      </React.Fragment>
    );
  };

  return (
    <div>
      <PageHeader />
      <div className={styles.dashboardContainer}>
        <Paper elevation={5} className={styles.dashboardInnerContainer}>
          <TabContext value={tabValue}>
            <Box
              sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}
            >
              <TabList
                onChange={(event, newValue) => setTabValue(newValue)}
                centered
              >
                <Tab label="My Invoices" value="1" />
                <Tab label="Invoices Sent to Me" value="2" />
              </TabList>
            </Box>
            <TabPanel
              value="1"
              sx={{ width: "90%", marginLeft: "auto", marginRight: "auto" }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.invoicesByProvider.map((row) => (
                      <Row key={row.id} row={row} own={true} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            <TabPanel
              value="2"
              sx={{ width: "90%", marginLeft: "auto", marginRight: "auto" }}
            >
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice #</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.invoicesByClient.map((row) => (
                      <Row key={row.id} row={row} own={false} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabContext>
        </Paper>
      </div>
      <Modal
        open={dashboard.transaction != null}
        onClose={() => dispatch(clearTransaction())}
      >
        <div className={styles.modalContainer}>
          <div>
            <CheckCircleOutlineIcon color="secondary" sx={{ fontSize: 80 }} />
          </div>
          <>
            {dashboard.actionType === ActionType.PAY
              ? "Invoice paid successfully!"
              : "Fund released successfully!"}
          </>
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
