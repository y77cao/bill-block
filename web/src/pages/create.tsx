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
  InputAdornment,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import DeleteIcon from "@mui/icons-material/Delete";
import { DateField } from "@mui/x-date-pickers";
import TextField from "@mui/material/TextField";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import { clearTransaction, createInvoice } from "@/redux/createSlice";
import { init, updateAccountData } from "@/redux/accountSlice";

import styles from "@/styles/create.module.css";
import PageHeader from "@/components/PageHeader";
import { AppDispatch } from "@/redux/store";
import { networkIdToTokenSymbolToAddresses } from "@/constants";
import { Milestone, TokenType } from "@/types";
import { ethers } from "ethers";
import { appError, clearAppError } from "@/redux/appSlice";

export default function Create() {
  const router = useRouter();

  const dispatch = useDispatch<AppDispatch>();
  const create = useSelector((state) => state.create);

  const [providerAddress, setProviderAddress] = useState(
    "0x00057dbAb8216b5259C581fe37A43C66245d8584"
  );
  const [clientAddress, setClientAddress] = useState(
    "0x8C6C58Cf5ab8719a4B86AdE698A7871c820a272d"
  );
  const [date, setDate] = useState<Date | null>(null);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [amount, setAmount] = useState<string | null>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<string | null>("WETH");
  const [tokenType, setTokenType] = useState(TokenType.ETH);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

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

  const sumMilestonePayments = () => {
    const sum = milestones.reduce((acc, milestone) => {
      return acc + Number(milestone.amount);
    }, 0);

    return sum.toFixed(3);
  };

  const validateInvoice = () => {
    const errors: string[] = [];
    if (!providerAddress) {
      errors.push("Provider address is required.");
    }
    if (!ethers.utils.isAddress(providerAddress)) {
      errors.push("Provider address is not valid.");
    }
    if (!clientAddress) {
      errors.push("Client address is required.");
    }
    if (!ethers.utils.isAddress(clientAddress)) {
      errors.push("Client address is not valid.");
    }
    if (!date) {
      errors.push("Date is required.");
    }
    if (!dueDate) {
      errors.push("Due date is required.");
    }
    if (dueDate && date && dueDate < date) {
      errors.push("Due date must be after current date.");
    }
    if (!itemName) {
      errors.push("Item name is required.");
    }
    if (tokenType !== TokenType.ERC721 && !amount) {
      errors.push("Amount is required.");
    }
    if (amount && !Number(amount)) {
      errors.push("Amount must be a number.");
    }
    if (tokenType === TokenType.ERC721 && !tokenId) {
      errors.push("Token ID is required.");
    }
    if (tokenType === TokenType.ERC721 && !tokenAddress) {
      errors.push("Token address is required.");
    }
    if (tokenId && !/^\+?(0|[1-9]\d*)$/.test(tokenId)) {
      errors.push("Token ID must be an integer.");
    }
    if (tokenAddress && !ethers.utils.isAddress(tokenAddress)) {
      errors.push("Token address is not valid.");
    }

    if (errors.length) {
      dispatch(
        appError(
          `Encountered the following errors while creating invoice: ${errors.join(
            " "
          )}`
        )
      );
      return false;
    }
    return true;
  };

  const onClickCreate = () => {
    const newInvoice = {
      providerAddress,
      clientAddress,
      date: date as Date,
      dueDate: dueDate as Date,
      itemName,
      itemDescription,
      amount,
      tokenSymbol: currency,
      tokenId: Number(tokenId),
      tokenType,
      tokenAddress,
      milestones,
    };

    const invoiceIsValid = validateInvoice();
    if (invoiceIsValid) {
      dispatch(clearAppError());
      dispatch(createInvoice(newInvoice));
    }
  };

  return (
    <div>
      <PageHeader />
      <div className={styles.createContainer}>
        <Paper elevation={10} className={styles.invoiceContainer}>
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
                      const tokenType = event.target.value as TokenType;
                      setTokenType(tokenType);
                      if (tokenType === TokenType.ERC721) {
                        setMilestones([]);
                      }
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
                  type="number"
                  value={amount}
                  InputLabelProps={{ shrink: amount !== null }}
                  onChange={(event) => {
                    if (tokenType === TokenType.ERC721) {
                      setTokenId(event.target.value as string);
                      setAmount(null);
                    } else {
                      setAmount(event.target.value as string);
                      setTokenId(null);
                    }
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
              onClick={() =>
                setMilestones([
                  ...milestones,
                  {
                    name: `Milestone ${milestones.length + 1} Payment`,
                    amount: "",
                  },
                ])
              }
              sx={{ width: "300px" }}
            >
              Add milestone
            </Button>
            <div className={styles.milestoneList}>
              {milestones.map((milestone, index) => (
                <div key={index} className={styles.milestoneItem}>
                  <TextField
                    label={`Milestone ${index + 1} Name`}
                    value={milestone.name}
                    variant="standard"
                    size="small"
                    onChange={(event) => {
                      const newMilestones = [...milestones];
                      newMilestones[index].name = event.target.value;
                      setMilestones(newMilestones);
                    }}
                  />
                  <TextField
                    label="Amount"
                    variant="standard"
                    size="small"
                    type="number"
                    value={milestone.amount}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          {tokenType === TokenType.ETH ? "ETH" : currency}
                        </InputAdornment>
                      ),
                    }}
                    onChange={(event) => {
                      const newMilestones = [...milestones];
                      newMilestones[index].amount = event.target.value;
                      setMilestones(newMilestones);
                      setAmount(sumMilestonePayments());
                    }}
                  />
                  <div
                    onClick={() => {
                      const newMilestones = [...milestones];
                      newMilestones.splice(index, 1);
                      setMilestones(newMilestones);
                      setAmount(sumMilestonePayments());
                    }}
                  >
                    <DeleteIcon color="primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Divider />
          <div className={styles.createInvoiceContainer}>
            <div>
              <LoadingButton
                variant="contained"
                loading={create.loading}
                fullWidth
                onClick={onClickCreate}
              >
                Create Invoice
              </LoadingButton>
            </div>
          </div>
        </Paper>
      </div>
      <Modal
        open={create.transaction !== null}
        onClose={() => dispatch(clearTransaction())}
      >
        <div className={styles.modalContainer}>
          <div>
            <CheckCircleOutlineIcon color="secondary" sx={{ fontSize: 80 }} />
          </div>
          <div>
            Invoice #{create.invoiceId} created successfully! You can share your
            invoice using the link below
          </div>
          <div className={styles.linkContainer}>
            <TextField
              disabled
              sx={{ width: "270px" }}
              value={`${process.env.NEXT_PUBLIC_BASE_URL}/pay/${create.invoiceId}`}
            />
            <ContentCopyIcon
              sx={{ cursor: "pointer" }}
              color="secondary"
              onClick={() =>
                navigator.clipboard.writeText(
                  `${process.env.NEXT_PUBLIC_BASE_URL}/pay/${create.invoiceId}`
                )
              }
            />
          </div>

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
