import { clearTransaction, releaseFund } from "@/redux/dashboardSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { TokenType } from "@/types";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Modal,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import styles from "../styles/ReleaseFundModal.module.css";
import styled from "@emotion/styled";

export const ReleaseFundModal = ({ invoice, open, onClose }) => {
  const {
    milestones,
    currMilestone,
    providerAddress,
    amount,
    tokenId,
    tokenSymbol,
  } = invoice;

  const dispatch = useDispatch<AppDispatch>();
  const dashboard = useSelector((state: RootState) => state.dashboard);
  const [milestoneUntil, setMilestoneUntil] = useState(currMilestone);

  const getReleaseMessage = () => {
    if (milestones.length) {
      return `Releasing payment(s) to address ${providerAddress} for the following milestones:`;
    } else {
      if (invoice.tokenType === TokenType.ERC721) {
        return `Releasing ${tokenSymbol} #${tokenId} to address ${providerAddress}`;
      }
      return `Release ${amount} ${
        invoice.tokenType === TokenType.ETH ? "ETH" : tokenSymbol
      } to address ${providerAddress}`;
    }
  };

  const SuccessView = () => {
    return (
      <div className={styles.modalContainer}>
        <div>
          <CheckCircleOutlineIcon color="secondary" sx={{ fontSize: 80 }} />
        </div>
        <>Fund released successfully!</>
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
        <div className={styles.title}>Release Payment(s)</div>
        <div className={styles.message}>{getReleaseMessage()}</div>
        <div className={styles.checkboxGroupContainer}>
          <FormGroup>
            {milestones.map((milestone, index) => {
              return (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={index < milestoneUntil}
                      disabled={index < currMilestone}
                      onChange={(event) => setMilestoneUntil(index + 1)}
                    />
                  }
                  label={`${milestone.name} (${milestone.amount} ${
                    invoice.tokenType === TokenType.ETH
                      ? "ETH"
                      : invoice.tokenSymbol
                  })`}
                />
              );
            })}
          </FormGroup>
        </div>
        <div className={styles.buttonContainer}>
          <LoadingButton
            variant="contained"
            fullWidth
            onClick={() =>
              dispatch(
                releaseFund(invoice.id, !milestones.length ? 1 : milestoneUntil)
              )
            }
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
