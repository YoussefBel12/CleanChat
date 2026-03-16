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
