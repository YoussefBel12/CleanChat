

import React from "react";
import { Button, Typography, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useSignalR } from "./SignalRProvider";

export default function LoginBar({ onConnectedUser }) {
    const { disconnect } = useSignalR();
    const navigate = useNavigate();

    //  get user name from token
    let name = "";
    const token = localStorage.getItem("token");

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            name = payload.FullName || payload.name || "";
        } catch { }
    }

    async function logout() {
        localStorage.removeItem("token");
        await disconnect();
        onConnectedUser?.({ id: "", name: "" });

        navigate("/login");
    }

    return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="body2">
                Hi, {name || "User"}
            </Typography>

            <Button variant="contained" color="error" onClick={logout}>
                Logout
            </Button>
        </Box>
    );
}
