import { Button } from "@mui/material";
import TextField from "@mui/material/TextField";

export default function Create() {
  return (
    <div>
      <div>INVOICE</div>
      <div>
        <TextField
          id="outlined-basic"
          label="Initiator Address"
          variant="outlined"
          size="small"
        />
        <TextField
          id="outlined-basic"
          label="Client Address"
          variant="outlined"
          size="small"
        />
        <TextField
          id="outlined-basic"
          label="Date"
          variant="outlined"
          size="small"
        />
        <TextField
          id="outlined-basic"
          label="Due Date"
          variant="outlined"
          size="small"
        />
      </div>
      <div>
        <div>
          <div>Item</div>
          <div>Amount</div>
          <Button variant="contained">Add Item</Button>
        </div>
      </div>
      <div>
        <div>
          <TextField
            id="outlined-basic"
            label="Notes"
            variant="outlined"
            size="small"
          />
          <TextField
            id="outlined-basic"
            label="Terms"
            variant="outlined"
            size="small"
          />
        </div>
        <div>
          <TextField
            id="outlined-basic"
            label="Amount"
            variant="outlined"
            size="small"
          />
        </div>
      </div>
    </div>
  );
}
