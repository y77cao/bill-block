import React from "react";
import { payInvoice } from "@/redux/dashboardSlice";
import { Invoice, InvoiceStatus, TokenType } from "@/types";
import { Button, TableRow, TableCell } from "@mui/material";
import { ReleaseFundModal } from "./ReleaseFundModal";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";

export const DashboardRow = (props: { row: Invoice; own: boolean }) => {
  const { row, own } = props;
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = React.useState(false);
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
