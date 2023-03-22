import { InvoiceStatus } from "@/types";
import { Chip } from "@mui/material";

const getColor = (status: InvoiceStatus) => {
  switch (status) {
    case InvoiceStatus.CREATED:
      return "default";
    case InvoiceStatus.FUNDED:
      return "secondary";
    case InvoiceStatus.PARTIALLY_PAID:
      return "warning";
    case InvoiceStatus.PAID:
      return "success";
    case InvoiceStatus.TERMINATED:
      return "error";
  }
};

export const InvoiceStatusPill = ({ status }: { status: InvoiceStatus }) => {
  return (
    <Chip label={InvoiceStatus[status as number]} color={getColor(status)} />
  );
};
