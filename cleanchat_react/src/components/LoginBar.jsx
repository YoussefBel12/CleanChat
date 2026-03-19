/*

import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import { useSignalR } from "./SignalRProvider";
import api from "./api";
import { useNavigate } from "react-router-dom";

export default function LoginBar({ onConnectedUser }) {
    const [email, setEmail] = useState(localStorage.getItem("email") || "")
    const [password, setPassword] = useState("");
    const { connect, disconnect, connected } = useSignalR();
    const navigate = useNavigate(); //  ADD THIS
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
            localStorage.setItem("email", email);

            navigate("/"); // redirect after login
        } catch (err) {
            console.warn("login error", err);
            alert("Login failed");
        }
    }

    async function logout() {
        localStorage.removeItem("token");
        await disconnect();
        onConnectedUser?.({ id: "", name: "" });
        navigate("/login"); // redirect after logout
    }

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField size="small" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
            <TextField size="small" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
            {!connected ? (
                <Button variant="contained" onClick={loginAndConnect}>Login & Connect</Button>
            ) : (
                    <Button variant="contained" onClick={logout}>Logout</Button>
            )}
        </Box>
    );
}
*/


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
