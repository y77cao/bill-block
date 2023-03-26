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
  Box,
  Tab,
} from "@mui/material";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { init, updateAccountData } from "@/redux/accountSlice";
import styles from "@/styles/dashboard.module.css";
import PageHeader from "@/components/PageHeader";
import { AppDispatch, RootState } from "@/redux/store";
import { DashboardRow } from "@/components/DashboardRow";
import { Invoice } from "@/types";

export default function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector((state: RootState) => state.dashboard);

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

  const DashboardView = ({ rows, own }: { rows: Invoice[]; own: boolean }) => {
    if (rows.length) {
      return (
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
              {rows.map((row) => (
                <DashboardRow key={row.id} row={row} own={own} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }

    return (
      <div className={styles.emptyView}>
        <div>Nothing is here yet...</div>
        <Button variant="contained">Create Invoice</Button>
      </div>
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
              sx={{
                width: "90%",
                marginLeft: "auto",
                marginRight: "auto",
                overflow: "scroll",
              }}
            >
              <DashboardView rows={dashboard.invoicesByProvider} own={true} />
            </TabPanel>
            <TabPanel
              value="2"
              sx={{
                width: "90%",
                marginLeft: "auto",
                marginRight: "auto",
                overflow: "scroll",
              }}
            >
              <DashboardView rows={dashboard.invoicesByClient} own={false} />
            </TabPanel>
          </TabContext>
        </Paper>
      </div>
    </div>
  );
}
