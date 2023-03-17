import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import {
  Button,
  Paper,
  Divider,
  InputLabel,
  Select,
  MenuItem,
  FormControl,
  Modal,
} from "@mui/material";
import { DateField } from "@mui/x-date-pickers";
import TextField from "@mui/material/TextField";

import {
  clearTransaction,
  createInvoice,
  init,
  updateAccountData,
} from "../redux/blockchainSlice";
import styles from "@/styles/create.module.css";
import PageHeader from "@/components/PageHeader";
import { AppDispatch } from "@/redux/store";
import { networkIdToTokenSymbolToAddresses } from "@/constants";
import { TokenType } from "@/types";

export default function Create() {
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const blockchain = useSelector((state) => state.blockchain);

  const [providerAddress, setProviderAddress] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string | null>("WETH");
  const [tokenType, setTokenType] = useState(TokenType.ETH);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);

  useEffect(() => {
    dispatch(init());

    // @ts-ignore checked in init
    const { ethereum } = window;
    ethereum?.on("accountsChanged", (accounts) => {
      dispatch(updateAccountData(accounts[0]));
    });
    ethereum?.on("chainChanged", (chainId) => {
      window.location.reload();
      dispatch(init());
    });
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
        tokenSymbol: currency,
        tokenType,
        tokenAddress,
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
                    value={tokenType}
                    label="Token"
                    onChange={(event) => {
                      setTokenType(event.target.value as TokenType);
                    }}
                  >
                    <MenuItem value={TokenType.ETH}>{TokenType.ETH}</MenuItem>
                    <MenuItem value={TokenType.ERC20}>
                      {TokenType.ERC20}
                    </MenuItem>
                    <MenuItem value={TokenType.ERC721}>
                      {TokenType.ERC721}
                    </MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label={tokenType === TokenType.ERC721 ? "Token ID" : "Amount"}
                  variant="standard"
                  size="small"
                  onChange={(event) => {
                    setAmount(event.target.value as string);
                  }}
                />
              </div>
              {tokenType !== TokenType.ETH && (
                <div>
                  <FormControl
                    disabled={
                      tokenType === TokenType.ERC721 || tokenAddress?.length > 0
                    }
                  >
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={currency}
                      label="Currency"
                      onChange={(event) => {
                        setCurrency(event.target.value as string);
                        setTokenAddress(null);
                      }}
                    >
                      {Object.keys(
                        networkIdToTokenSymbolToAddresses[
                          process.env.NEXT_PUBLIC_NETWORK_ID as string
                        ]
                      ).map((tokenSymbol) => (
                        <MenuItem key={tokenSymbol} value={tokenSymbol}>
                          {tokenSymbol}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <>OR</>
                  <TextField
                    label="Token address"
                    variant="standard"
                    size="small"
                    onChange={(event) => {
                      setTokenAddress(event.target.value as string);
                      setCurrency(null);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          <div className={styles.milestoneContainer}>
            <Button
              variant="contained"
              disabled={tokenType === TokenType.ERC721}
            >
              Add milestone
            </Button>
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
      <Modal
        open={blockchain.transaction != null}
        onClose={() => dispatch(clearTransaction())}
      >
        <div className={styles.modalContainer}>
          <>Invoice created successfully!</>
          <div className={styles.buttonContainer}>
            <Button
              variant="contained"
              onClick={() => dispatch(clearTransaction())}
            >
              View Transaction
            </Button>
            <Button
              variant="contained"
              onClick={() => {
                dispatch(clearTransaction());
                router.push("/dashboard");
              }}
            >
              View Invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
