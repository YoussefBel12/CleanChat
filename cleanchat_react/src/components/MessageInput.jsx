/*
import React from "react";
import { Box, TextField, Button } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function MessageInput({ messageText, setMessageText, onSend, placeholder, disabled }) {
    return (
        <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
                fullWidth size="small" placeholder={placeholder}
                value={messageText} onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onSend(); }}
            />
            <Button variant="contained" endIcon={<SendIcon />} onClick={onSend} disabled={disabled}>Send</Button>
        </Box>
    );
}
*/


//VERSION 2
import React from "react";
import { Box, TextField, IconButton } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function MessageInput({ messageText, setMessageText, onSend, placeholder, disabled }) {
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    return (
        <Box sx={{ p: 2, display: "flex", gap: 1, bgcolor: "#fff", borderTop: "1px solid", borderColor: "divider" }}>
            <TextField
                fullWidth
                size="small"
                placeholder={placeholder}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={disabled}
                multiline
                maxRows={4}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 4 } }}
            />
            <IconButton color="primary" onClick={onSend} disabled={disabled || !messageText.trim()}>
                <SendIcon />
            </IconButton>
        </Box>
    );
}
