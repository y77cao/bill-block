import React from "react";
import { Invoice, InvoiceStatus, TokenType } from "@/types";
import { Button, TableRow, TableCell, Chip } from "@mui/material";
import { ReleaseFundModal } from "./ReleaseFundModal";
import { InvoiceStatusPill } from "./InvoiceStatusPill";
import { PayModal } from "./PayModal";

export const DashboardRow = (props: { row: Invoice; own: boolean }) => {
  const { row, own } = props;
  const [loading, setLoading] = React.useState(false);
  const [openModal, setOpenModal] = React.useState(false);

  const getActionComponent = () => {
    switch (row.status) {
      case InvoiceStatus.CREATED:
        return (
          <PayModal
            invoice={row}
            open={openModal}
            onClose={() => setOpenModal(false)}
          />
        );
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
          <Button variant="contained" onClick={() => setOpenModal(true)}>
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
          {row.tokenType === TokenType.ERC721 ? "1" : row.amount?.toString()}{" "}
          {row.tokenSymbol}
        </TableCell>
        <TableCell>
          <InvoiceStatusPill status={row.status as InvoiceStatus} />
        </TableCell>
        <TableCell>{getActionButton(row, own)}</TableCell>
      </TableRow>
      {getActionComponent()}
    </React.Fragment>
  );
};
