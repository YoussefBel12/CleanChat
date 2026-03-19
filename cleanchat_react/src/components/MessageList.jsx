/*
import React, { useEffect, useRef } from "react";
import { List, ListItem, ListItemText } from "@mui/material";

export default function MessageList({ messages }) {
    const ref = useRef(null);

    useEffect(() => {
        // auto-scroll to bottom on messages change
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [messages]);

    return (
        <List sx={{ flexGrow: 1, overflow: "auto", mb: 1 }} ref={ref}>
            {messages.length === 0 && <ListItem><ListItemText primary="No messages yet" /></ListItem>}
            {messages.map((m, i) => <ListItem key={i} divider><ListItemText primary={m} /></ListItem>)}
        </List>
    );
}
*/

//VERSION 2
import React, { useEffect, useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function MessageList({ messages, currentUser }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [messages]);

    // Helper to parse a message string like "HH:MM:SS Sender: text"
    const parseMessage = (msg) => {
        const parts = msg.split(":");
        if (parts.length < 3) return { time: "", sender: "System", text: msg };
        const time = parts[0].trim();
        const sender = parts[1].trim();
        const text = parts.slice(2).join(":").trim();
        return { time, sender, text };
    };

    return (
        <Box ref={ref} sx={{ flex: 1, overflow: "auto", p: 2, bgcolor: "#e5ddd5" }}>
            {messages.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center">
                    No messages yet
                </Typography>
            )}
            {messages.map((msg, idx) => {
                const { time, sender, text } = parseMessage(msg);
                const isOwn = sender === currentUser?.name;
                return (
                    <Box
                        key={idx}
                        sx={{
                            display: "flex",
                            justifyContent: isOwn ? "flex-end" : "flex-start",
                            mb: 1
                        }}
                    >
                        <Paper
                            elevation={1}
                            sx={{
                                p: 1.5,
                                maxWidth: "70%",
                                borderRadius: 2,
                                bgcolor: isOwn ? "#dcf8c6" : "#fff",
                                wordWrap: "break-word"
                            }}
                        >
                            {!isOwn && (
                                <Typography variant="caption" color="text.secondary" component="div">
                                    {sender}
                                </Typography>
                            )}
                            <Typography variant="body2">{text}</Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ display: "block", textAlign: "right", mt: 0.5 }}>
                                {time}
                            </Typography>
                        </Paper>
                    </Box>
                );
            })}
        </Box>
    );
}