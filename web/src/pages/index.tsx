import Button from "@mui/material/Button";
import styles from "../styles/index.module.css";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.main}>
      <div className={styles.headerContainer}>
        <div>BillBlock</div>
        <Button variant="contained">Connect Wallet</Button>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.buttonContainer}>
          <Button variant="contained" onClick={() => router.push("/create")}>
            Create an Invoice
          </Button>
          <Button variant="contained" onClick={() => router.push("/pay")}>
            Pay an Invoice
          </Button>
        </div>
      </div>
    </div>
  );
}
