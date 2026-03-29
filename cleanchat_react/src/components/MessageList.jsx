
import React, { useEffect, useRef } from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function MessageList({ messages, currentUser }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current) {
            ref.current.scrollTop = ref.current.scrollHeight;
        }
    }, [messages]);

    // Parse a message string like "10:34:27 AM Admin Admin: check private"
    // into { time, sender, text }
    const parseMessage = (msg) => {
        // Regex explanation:
        // ^(\d{1,2}:\d{2}:\d{2}(?:\s+[AP]M)?)  → timestamp (with optional AM/PM)
        //  (.+?):                              → sender (non‑greedy up to the colon)
        //  (.*)$                               → message (the rest)
        const match = msg.match(/^(\d{1,2}:\d{2}:\d{2}(?:\s+[AP]M)?) (.+?): (.*)$/);
        if (!match) {
            // Fallback: treat the whole string as message from "System"
            return { time: "", sender: "System", text: msg };
        }
        const [, time, sender, text] = match;
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
                            mb: 1,
                        }}
                    >
                        <Paper
                            elevation={1}
                            sx={{
                                p: 1.5,
                                maxWidth: "70%",
                                borderRadius: 2,
                                bgcolor: isOwn ? "#dcf8c6" : "#fff",
                                wordWrap: "break-word",
                            }}
                        >
                            {!isOwn && (
                                <Typography variant="caption" color="text.secondary" component="div">
                                    {sender}
                                </Typography>
                            )}
                            <Typography variant="body2">{text}</Typography>
                            <Typography
                                variant="caption"
                                color="text.disabled"
                                sx={{ display: "block", textAlign: "right", mt: 0.5 }}
                            >
                                {time}
                            </Typography>
                        </Paper>
                    </Box>
                );
            })}
        </Box>
    );
}