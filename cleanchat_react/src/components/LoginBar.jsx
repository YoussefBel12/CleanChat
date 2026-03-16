import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useSignalR } from "./SignalRProvider";
import api from "./api";

export default function LoginBar({ onConnectedUser }) {
    const [email, setEmail] = useState("manal@gmail.com");
    const [password, setPassword] = useState("Manal123&");
    const { connect, disconnect, connected } = useSignalR();

    async function loginAndConnect() {
        try {
            const res = await api.post("/Auth/login", { email, password });
            const token = res.data.token ?? res.data.accessToken ?? res.data.jwt;
            if (!token) throw new Error("no token");
            localStorage.setItem("token", token);

            // optional: parse token and forward user info
            try {
                const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
                onConnectedUser?.({ id: payload.sub ?? payload.nameid ?? "", name: payload.FullName ?? payload.name ?? payload.fullName ?? "" });
            } catch { }

            await connect(token);
        } catch (err) {
            console.warn("login error", err);
            alert("Login failed");
        }
    }

    async function logout() {
        localStorage.removeItem("token");
        await disconnect();
        onConnectedUser?.({ id: "", name: "" });
    }

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField size="small" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            <TextField size="small" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            {!connected ? (
                <Button variant="contained" onClick={loginAndConnect}>Login & Connect</Button>
            ) : (
                <Button variant="outlined" onClick={logout}>Logout</Button>
            )}
        </Box>
    );
}

