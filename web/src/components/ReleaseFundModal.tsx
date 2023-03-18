import { clearTransaction, releaseFund } from "@/redux/blockchainSlice";
import { AppDispatch } from "@/redux/store";
import { Button, Modal } from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import styles from "../styles/ReleaseFundModal.module.css";

export const ReleaseFundModal = ({ invoice, open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);

  const handleReleaseFund = async () => {
    // dispatch(releaseFund(invoice));
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        dispatch(clearTransaction());
        onClose();
      }}
    >
      <div className={styles.modalContainer}>
        <div>
          <div className={styles.title}>Release Fund</div>
          <div></div>
        </div>
        <div className={styles.buttonContainer}>
          <Button variant="contained" onClick={() => {}}>
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
