


import React from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import SignalRProvider from "./components/SignalRProvider";
import ChatPage from "./components/ChatPage";

const theme = createTheme({
    palette: {
        primary: { main: "#2e7d32" },
        secondary: { main: "#a5d6a7" },
    },
});

 function App() {
    return (
        <ThemeProvider theme={theme}>
            <SignalRProvider>
                <ChatPage />
            </SignalRProvider>
        </ThemeProvider>
    );
}
export default App;