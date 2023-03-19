import type { AppProps } from "next/app";
import { Provider } from "react-redux";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import { store } from "../redux/store";
import "../styles/global.css";

declare module "@mui/material/styles" {
  interface Theme {
    status: {
      danger: string;
    };
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#2944fb",
    },
    secondary: {
      main: "#a09cff",
    },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
          <Component {...pageProps} />
        </ThemeProvider>
      </LocalizationProvider>
    </Provider>
  );
}
