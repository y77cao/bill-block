import { clearTransaction, releaseFund } from "@/redux/dashboardSlice";
import { AppDispatch } from "@/redux/store";
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
import styles from "../styles/ReleaseFundModal.module.css";

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
  const dashboard = useSelector((state) => state.dashboard);
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
  return (
    <Modal
      open={open}
      onClose={() => {
        dispatch(clearTransaction());
        onClose();
      }}
    >
      <div className={styles.modalContainer}>
        <div className={styles.title}>{getReleaseMessage()}</div>
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
    </Modal>
  );
};
