


import React from "react";
import { ThemeProvider, createTheme ,Box } from "@mui/material";
import SignalRProvider from "./components/SignalRProvider";
import ChatPage from "./components/ChatPage";
 
import ProtectedRoute from "./components/ProtectedRoute"; //wrap chat to let only logged in users
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
const theme = createTheme({
    palette: {
        primary: { main: "#2e7d32" },
        secondary: { main: "#a5d6a7" },
    },
});

 function App() {
     return (
        /*
        <ThemeProvider theme={theme}>
            <SignalRProvider>
                <ChatPage />
            </SignalRProvider>
        </ThemeProvider>
        */



         <ThemeProvider theme={theme}>
             <SignalRProvider>
                 <BrowserRouter>
                     <Box sx={{ width: "100vw", height: "100vh" }}>
                     <Routes>
                         <Route path="/login" element={<Login />} />
                         <Route path="/register" element={<Register />} />

                         <Route
                             path="/"
                             element={
                                 <ProtectedRoute>
                                     <ChatPage />
                                 </ProtectedRoute>
                             }
                         />
                         </Routes>
                     </Box>
                 </BrowserRouter>
             </SignalRProvider>
         </ThemeProvider>



    );
}
export default App;