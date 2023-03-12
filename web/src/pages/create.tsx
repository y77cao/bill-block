import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  Button,
  Paper,
  Divider,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import { DateField } from "@mui/x-date-pickers";
import TextField from "@mui/material/TextField";

import { createInvoice, init } from "../redux/blockchainSlice";
import styles from "@/styles/create.module.css";
import { PageHeader } from "@/components/PageHeader";
import { AppDispatch } from "@/redux/store";

export default function Create() {
  const dispatch = useDispatch<AppDispatch>();

  const [providerAddress, setProviderAddress] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [token, setToken] = useState("ETH");

  useEffect(() => {
    dispatch(init());

    // @ts-ignore checked in init
    const { ethereum } = window;
    // ethereum?.on("accountsChanged", (accounts) =>
    //   dispatch(updateAccountMetadata(accounts[0]))
    // );
    // ethereum?.on("chainChanged", (chainId) => {
    //   window.location.reload();
    //   dispatch(init());
    // });
  }, []);

  const onClickCreate = () => {
    dispatch(
      createInvoice({
        providerAddress,
        clientAddress,
        date: date as Date,
        dueDate: dueDate as Date,
        itemName,
        itemDescription,
        amount,
        currency,
        token,
      })
    );
  };

  return (
    <div>
      <PageHeader />
      <div className={styles.createContainer}>
        <Paper elevation={3} square className={styles.invoiceContainer}>
          <div className={styles.invoiceTitle}>INVOICE</div>
          <div className={styles.invoiceTop}>
            <div className={styles.invoiceTopRight}>
              <TextField
                label="Provider Address"
                variant="standard"
                size="small"
                fullWidth
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setProviderAddress(event.target.value);
                }}
              />
              <TextField
                label="Client Address"
                variant="standard"
                size="small"
                fullWidth
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setClientAddress(event.target.value);
                }}
              />
              <DateField
                label="Date"
                variant="standard"
                fullWidth
                size="small"
                onChange={(value) => {
                  setDate(value.toDate());
                }}
              />
              <DateField
                label="Due Date"
                variant="standard"
                fullWidth
                size="small"
                onChange={(value) => {
                  setDueDate(value.toDate());
                }}
              />
            </div>
          </div>
          <Divider />
          <div className={styles.itemContainer}>
            <div className={styles.itemLeft}>
              <TextField
                label="Item Name"
                variant="standard"
                size="small"
                fullWidth
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setItemName(event.target.value);
                }}
              />
              <TextField
                label="Item Description"
                variant="outlined"
                size="small"
                multiline
                fullWidth
                minRows={4}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  setItemDescription(event.target.value);
                }}
              />
            </div>
            <div className={styles.itemRight}>
              <div>
                <FormControl>
                  <InputLabel>Token</InputLabel>
                  <Select
                    value={token}
                    label="Token"
                    onChange={(event) => {
                      setToken(event.target.value as string);
                    }}
                  >
                    <MenuItem value={"ETH"}>ETH</MenuItem>
                    <MenuItem value={"ERC20"}>ERC20</MenuItem>
                    <MenuItem value={"ERC721"}>ERC721</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label={token === "ERC721" ? "Token ID" : "Amount"}
                  variant="standard"
                  size="small"
                  onChange={(event) => {
                    setAmount(event.target.value as string);
                  }}
                />
              </div>
              {token !== "ETH" && (
                <div>
                  <FormControl>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={"ETH"}
                      label="Currency"
                      onChange={(event) => {
                        setCurrency(event.target.value as string);
                      }}
                    >
                      <MenuItem value={"ETH"}>ETH</MenuItem>
                      <MenuItem value={"ERC20"}>ERC20</MenuItem>
                      <MenuItem value={"ERC721"}>ERC721</MenuItem>
                    </Select>
                  </FormControl>
                  <>OR</>
                  <TextField
                    label="Token address"
                    variant="standard"
                    size="small"
                  />
                </div>
              )}
            </div>
          </div>
          <div className={styles.milestoneContainer}>
            <Button variant="contained">Add milestone</Button>
          </div>
          <Divider />
          <div className={styles.createInvoiceContainer}>
            <div>
              <Button variant="contained" fullWidth onClick={onClickCreate}>
                Create Invoice
              </Button>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
}
