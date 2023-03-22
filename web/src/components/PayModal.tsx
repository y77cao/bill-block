import { clearTransaction, payInvoice } from "@/redux/dashboardSlice";
import { AppDispatch } from "@/redux/store";
import { TokenType } from "@/types";
import { LoadingButton } from "@mui/lab";
import { Button, Modal } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import styles from "../styles/PayModal.module.css";

export const PayModal = ({ invoice, open, onClose }) => {
  const { id, amount, tokenId, tokenSymbol } = invoice;

  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector((state) => state.dashboard);

  const getPayMessage = () => {
    if (invoice.tokenType === TokenType.ERC721) {
      return `Paying ${tokenSymbol} #${tokenId} to invoice #${id}. You will recieve two transactions to sign. First the token approval transaction, then the payment transaction.`;
    } else if (invoice.tokenType === TokenType.ERC20) {
      return `Paying ${amount} ${tokenSymbol} to invoice#${id}. You will recieve two transactions to sign. First the token approval transaction, then the payment transaction.`;
    }
    return `Paying ${amount} ETH to invoice#${id}`;
  };

  const SuccessView = () => {
    return (
      <div className={styles.modalContainer}>
        <div>
          <CheckCircleOutlineIcon color="secondary" sx={{ fontSize: 80 }} />
        </div>
        <>Invoice paid successfully!</>
        <div className={styles.buttonContainer}>
          <Button
            variant="contained"
            onClick={() => {
              dispatch(clearTransaction());
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  };

  const ConfirmView = () => {
    return (
      <div className={styles.modalContainer}>
        <div className={styles.title}>Confirm Payment</div>
        <div className={styles.message}>{getPayMessage()}</div>
        <div className={styles.buttonContainer}>
          <LoadingButton
            variant="contained"
            fullWidth
            onClick={() => dispatch(payInvoice(invoice))}
            loading={dashboard.loading}
          >
            Confirm
          </LoadingButton>
        </div>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        dispatch(clearTransaction());
        onClose();
      }}
    >
      {dashboard.transaction ? <SuccessView /> : <ConfirmView />}
    </Modal>
  );
};
