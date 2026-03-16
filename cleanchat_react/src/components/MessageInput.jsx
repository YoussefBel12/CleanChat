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
