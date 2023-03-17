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
  Box,
  Tab,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { KeyboardArrowUp, KeyboardArrowDown } from "@mui/icons-material";

import {
  clearTransaction,
  init,
  payInvoice,
  updateAccountData,
} from "../redux/blockchainSlice";
import styles from "@/styles/dashboard.module.css";
import PageHeader from "@/components/PageHeader";
import { AppDispatch } from "@/redux/store";
import { Invoice, TokenType } from "@/types";

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const blockchain = useSelector((state) => state.blockchain);

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
            {row.tokenType === TokenType.ERC721 ? "1" : row.amount.toString()}{" "}
            {row.tokenSymbol}
          </TableCell>
          <TableCell>{row.status}</TableCell>
          <TableCell>
            <Button
              variant="contained"
              onClick={() => dispatch(payInvoice(row))}
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

  return (
    <div>
      <PageHeader />
      <div className={styles.dashboardContainer}>
        <Paper elevation={3} square className={styles.dashboardInnerContainer}>
          <TabContext value={tabValue}>
            <Box
              sx={{ borderBottom: 1, borderColor: "divider", width: "100%" }}
            >
              <TabList
                onChange={(event, newValue) => setTabValue(newValue)}
                aria-label="lab API tabs example"
              >
                <Tab label="My Invoices" value="1" />
                <Tab label="Invoices Sent to Me" value="2" />
              </TabList>
            </Box>
            <TabPanel value="1" sx={{ width: "100%" }}>
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
                    {blockchain.invoicesByProvider.map((row) => (
                      <Row key={row.id} row={row} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
            <TabPanel value="2" sx={{ width: "100%" }}>
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
                    {blockchain.invoicesByClient.map((row) => (
                      <Row key={row.id} row={row} />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </TabPanel>
          </TabContext>
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
