import { clearTransaction, releaseFund } from "@/redux/dashboardSlice";
import { AppDispatch } from "@/redux/store";
import { TokenType } from "@/types";
import {
  Button,
  Modal,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { useState } from "react";
import { useDispatch } from "react-redux";
import styles from "../styles/ReleaseFundModal.module.css";

export const ReleaseFundModal = ({ invoice, open, onClose }) => {
  const { milestones, currMilestone, clientAddress, amount, tokenSymbol } =
    invoice;

  const dispatch = useDispatch<AppDispatch>();
  const [loading, setLoading] = useState(false);
  const [milestoneUntil, setMilestoneUntil] = useState(currMilestone);

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
          <div className={styles.title}>
            {milestones.length
              ? `Releasing payment(s) to address ${clientAddress} for the following milestones:`
              : `Release ${amount} ${
                  invoice.tokenType === TokenType.ETH
                    ? "ETH"
                    : invoice.tokenSymbol
                } to address ${clientAddress}`}
          </div>
          <div>
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
        </div>
        <div className={styles.buttonContainer}>
          <Button
            variant="contained"
            onClick={() =>
              dispatch(
                releaseFund(invoice.id, !milestones.length ? 1 : milestoneUntil)
              )
            }
          >
            Confirm
          </Button>
        </div>
      </div>
    </Modal>
  );
};
