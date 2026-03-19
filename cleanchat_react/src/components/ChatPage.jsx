/*

import React, { useEffect, useState, useRef } from "react";
import {Button, Box, AppBar, Toolbar, Typography, Container, Grid, Paper, Snackbar, Alert } from "@mui/material";
import LoginBar from "./LoginBar";
import ChannelsSidebar from "./ChannelsSidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useSignalR } from "./SignalRProvider";
import api from "./api";

export default function ChatPage() {
    const { connectionRef, connected, connect, disconnect } = useSignalR();
    const [currentUser, setCurrentUser] = useState({ id: "", name: "" });

    // channels / presence
    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [onlineUserIds, setOnlineUserIds] = useState([]);

    // messages store keyed by channelKey
    const [messagesMap, setMessagesMap] = useState({ public: [] });
    const [channel, setChannel] = useState({ type: "public", id: "" });
    const [messageText, setMessageText] = useState("");

    // unread & typing
    const [unreadUsers, setUnreadUsers] = useState({});
    const [unreadGroups, setUnreadGroups] = useState({});
    const [typingMap, setTypingMap] = useState({ private: {}, group: {} });

    const [newGroupName, setNewGroupName] = useState("");
    const [notice, setNotice] = useState(null);

    const usersRef = useRef(users);
    useEffect(() => { usersRef.current = users; }, [users]);

    //pagination
    const [pagination, setPagination] = useState({});



    // helper: push message into messagesMap and unread counters

    function pushMessage(key, text) {
        setMessagesMap(prev => {
            const updated = [...(prev[key] || []), text];

            return {
                ...prev,
                [key]: updated.slice(-10) // keep ONLY last 10 messages
            };
        });

    // unread logic stays the same







        // unread if not active
        const channelKey = channelKeyFor(channel);
        if (key !== channelKey) {
            if (key.startsWith("user:")) {
                const id = key.slice(5);
                setUnreadUsers(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            } else if (key.startsWith("group:")) {
                const id = key.slice(6);
                setUnreadGroups(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            }
        }
    }

    function channelKeyFor(ch) {
        if (!ch) return "public";
        if (ch.type === "public") return "public";
        if (ch.type === "private") return `user:${ch.id}`;
        return `group:${ch.id}`;
    }

    // fetch helpers
    async function loadUsers() {
        try {
            const res = await api.get("/Users");
            setUsers(res.data);
        } catch (err) { console.warn(err); }
    }
    async function loadGroups() {
        try {
            const res = await api.get("/Groups");
            setGroups(res.data);
        } catch (err) { console.warn(err); }
    }

   
    async function loadPublicHistory(loadMore = false) {
        try {
            const key = "public";
            const skip = loadMore ? (pagination[key] || 0) : 0;

            const res = await api.get(`/Messages?take=10&skip=${skip}`);

            const newMsgs = res.data.map(i =>
                formatMsg(i.timestamp, i.user, i.message)
            );

            setMessagesMap(prev => ({
                ...prev,
                [key]: loadMore
                    ? [...newMsgs, ...(prev[key] || [])] //  prepend older
                    : newMsgs
            }));

            setPagination(prev => ({
                ...prev,
                [key]: skip + 10
            }));

        } catch (err) {
            console.warn(err);
        }
    }





    function formatMsg(ts, sender, txt) {
        try { return `${new Date(ts).toLocaleTimeString()} ${sender}: ${txt}`; } catch { return `${sender}: ${txt}`; }
    }

    // connect and attach handlers (only once)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            // set user name from token if possible
            try {
                const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
                setCurrentUser({ id: payload.sub ?? payload.nameid ?? "", name: payload.FullName ?? payload.name ?? payload.fullName ?? "" });
            } catch (e) {
                console.error("Error occurred:", e.message);
            }
            loadUsers();
            loadGroups();
            loadPublicHistory();

            // connect (SignalRProvider ensures one connection)
            connect(token).then((connection) => {
                // register listeners on the connectionRef object - ensure we don't double-register
                const conn = connectionRef.current;
                if (!conn) return;

                // clear old handlers just in case
                conn.off("ReceiveMessage"); conn.off("ReceivePrivateMessage"); conn.off("ReceiveGroupMessage");
                conn.off("PresenceList"); conn.off("PresenceUpdated");
                conn.off("TypingPrivate"); conn.off("TypingGroup"); conn.off("GroupCreated");

                conn.on("ReceiveMessage", (userName, message, timestamp) => {
                    pushMessage("public", formatMsg(timestamp, userName, message));
                });

                conn.on("ReceivePrivateMessage", (senderId, senderName, message, timestamp) => {
                    const key = `user:${senderId}`;
                    pushMessage(key, formatMsg(timestamp, senderName, message));
                });

                conn.on("PrivateMessageSent", (targetId, senderName, message, timestamp) => {
                    const key = `user:${targetId}`;
                    pushMessage(key, formatMsg(timestamp, senderName, message));
                });

                conn.on("ReceiveGroupMessage", (groupId, senderName, message, timestamp) => {
                    const key = `group:${groupId}`;
                    pushMessage(key, formatMsg(timestamp, senderName, message));
                });

                conn.on("GroupCreated", (group) => {
                    if (!group) return;
                    setGroups(prev => prev.some(g => g.id === group.id) ? prev : [...prev, group]);
                    setUnreadGroups(prev => ({ ...prev, [group.id]: 0 }));
                });

                conn.on("PresenceList", (userIds) => {
                    if (Array.isArray(userIds)) setOnlineUserIds(userIds);
                });

                conn.on("PresenceUpdated", (userId, online) => {
                    setOnlineUserIds(prev => {
                        const set = new Set(prev);
                        if (online) set.add(userId); else set.delete(userId);
                        return Array.from(set);
                    });
                });

                conn.on("TypingPrivate", (senderName) => {
                    const found = usersRef.current.find(u => (u.fullName ?? u.email) === senderName);
                    const id = found ? found.id : `unknown:${senderName}`;
                    setTypingMap(prev => ({ ...prev, private: { ...(prev.private || {}), [id]: senderName } }));
                    setTimeout(() => setTypingMap(prev => { const p = { ...(prev.private || {}) }; delete p[id]; return { ...prev, private: p }; }), 3000);
                });

                conn.on("TypingGroup", (groupId, senderName) => {
                    setTypingMap(prev => ({ ...prev, group: { ...(prev.group || {}), [groupId]: senderName } }));
                    setTimeout(() => setTypingMap(prev => { const g = { ...(prev.group || {}) }; delete g[groupId]; return { ...prev, group: g }; }), 3000);
                });

            }).catch(e => console.warn(e));
        }

        // cleanup on unmount
        return () => {
            // do not disconnect automatically; keep user choice. If you want to stop, call disconnect()
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // channel switch: load history & clear unread
    useEffect(() => {
        const k = channelKeyFor(channel);
        // clear unread for the channel key
        if (k.startsWith("user:")) {
            const id = k.slice(5);
            setUnreadUsers(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            if (!messagesMap[k]) fetchPrivateHistory(id);
        } else if (k.startsWith("group:")) {
            const id = k.slice(6);
            setUnreadGroups(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            if (!messagesMap[k]) fetchGroupHistory(id);
        } else {
            if (!messagesMap.public || messagesMap.public.length === 0) loadPublicHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channel]);


 

    async function fetchPrivateHistory(otherUserId, loadMore = false) {
        try {
            const key = `user:${otherUserId}`;
            const skip = loadMore ? (pagination[key] || 0) : 0;

            const res = await api.get(`/Messages/private/${otherUserId}?take=10&skip=${skip}`);

            const newMsgs = res.data.map(i =>
                formatMsg(i.timestamp, i.user, i.message)
            );

            setMessagesMap(prev => ({
                ...prev,
                [key]: loadMore
                    ? [...newMsgs, ...(prev[key] || [])]
                    : newMsgs
            }));

            setPagination(prev => ({
                ...prev,
                [key]: skip + 10
            }));

        } catch (err) {
            console.warn(err);
        }
    }




 


    async function fetchGroupHistory(groupId, loadMore = false) {
        try {
            const key = `group:${groupId}`;
            const skip = loadMore ? (pagination[key] || 0) : 0;

            const res = await api.get(`/groups/${groupId}/messages?take=10&skip=${skip}`);

            const newMsgs = res.data.map(i =>
                formatMsg(i.timestamp, i.senderName, i.message)
            );

            setMessagesMap(prev => ({
                ...prev,
                [key]: loadMore
                    ? [...newMsgs, ...(prev[key] || [])]
                    : newMsgs
            }));

            setPagination(prev => ({
                ...prev,
                [key]: skip + 10
            }));

        } catch (err) {
            console.warn(err);
        }
    }



    // send message
    async function sendMessage() {
        if (!connectionRef.current) { setNotice({ severity: "warning", message: "Not connected" }); return; }
        const text = messageText.trim();
        if (!text) return;
        try {
            if (channel.type === "public") {
                await connectionRef.current.invoke("SendMessage", text);
            } else if (channel.type === "private") {
                await connectionRef.current.invoke("SendPrivateMessage", channel.id, text);
            } else if (channel.type === "group") {
                await connectionRef.current.invoke("SendGroupMessage", channel.id, text);
            }
            setMessageText("");
        } catch (err) {
            console.warn(err);
            setNotice({ severity: "error", message: "Send error" });
        }
    }

    async function createGroup() {
        if (!newGroupName.trim()) return;
        try {
            await api.post("/Groups", newGroupName);
            await loadGroups();
            setNewGroupName("");
            setNotice({ severity: "success", message: "Group created" });
        } catch (err) {
            console.warn(err);
            setNotice({ severity: "error", message: "Create group failed" });
        }
    }

    async function joinGroup() {
        if (channel.type !== "group") return setNotice({ severity: "warning", message: "Select a group" });
        try {
            await connectionRef.current.invoke("JoinGroup", channel.id);
            setNotice({ severity: "info", message: "Joined group" });
        } catch (err) {
            console.warn(err);
        }
    }

    async function leaveGroup() {
        if (channel.type !== "group") return setNotice({ severity: "warning", message: "Select a group" });
        try {
            await connectionRef.current.invoke("LeaveGroup", channel.id);
            setNotice({ severity: "info", message: "Left group" });
        } catch (err) {
            console.warn(err);
        }
    }

    const channelKey = channelKeyFor(channel);
    const currentMessages = messagesMap[channelKey] || [];

    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>CleanChat</Typography>
                    <LoginBar onConnectedUser={setCurrentUser} />
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
                <Grid container spacing={2} sx={{ height: "calc(100% - 32px)" }}>
                    <Grid item xs={3}>
                        <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                            <ChannelsSidebar
                                users={users} groups={groups}
                                onlineUserIds={onlineUserIds}
                                unreadUsers={unreadUsers} unreadGroups={unreadGroups}
                                channel={channel} setChannel={setChannel}
                                joinGroup={joinGroup} leaveGroup={leaveGroup}
                                newGroupName={newGroupName} setNewGroupName={setNewGroupName} createGroup={createGroup}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={9}>
                        <Paper sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                                {channel.type === "public" && "Public Chat"}
                                {channel.type === "private" && `Private: ${users.find(u => u.id === channel.id)?.fullName ?? 'Private Chat'}`}
                                {channel.type === "group" && `Group: ${groups.find(g => g.id === channel.id)?.name ?? 'Group'}`}
                            </Typography>

                            
                            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        if (channel.type === "public") loadPublicHistory(true);
                                        else if (channel.type === "private") fetchPrivateHistory(channel.id, true);
                                        else fetchGroupHistory(channel.id, true);
                                    }}
                                >
                                    Load older messages
                                </Button>
                            </Box>

                            <MessageList messages={currentMessages} />











                            <Box sx={{ minHeight: 24, mb: 1 }}>
                                {channel.type === "private" && typingMap.private[channel.id] && <Typography variant="caption">{typingMap.private[channel.id]} is typing...</Typography>}
                                {channel.type === "group" && typingMap.group[channel.id] && <Typography variant="caption">{typingMap.group[channel.id]} is typing...</Typography>}
                            </Box>

                            <MessageInput
                                messageText={messageText} setMessageText={setMessageText}
                                onSend={sendMessage}
                                placeholder={channel.type === "public" ? "Message public chat..." : channel.type === "private" ? `Message ${users.find(u => u.id === channel.id)?.fullName ?? 'user'}...` : `Message group...`}
                                disabled={!connected}
                            />

                            <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                <Button onClick={() => { if (channel.type === "public") loadPublicHistory(); else if (channel.type === "private") fetchPrivateHistory(channel.id); else fetchGroupHistory(channel.id); }}>Refresh</Button>
                                <Button onClick={loadUsers}>Refresh Users</Button>
                                <Button onClick={loadGroups}>Refresh Groups</Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>

            <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}>
                {notice && <Alert onClose={() => setNotice(null)} severity={notice.severity}>{notice.message}</Alert>}
            </Snackbar>
        </Box>
    );
}



*/

//VERSION 2 BELOW ONLY WORKS WITH V2 COMPONENTS

import React, { useEffect, useState, useRef } from "react";
import {
    Box, AppBar, Toolbar, Typography, Container, Paper,
    Snackbar, Alert, IconButton, Badge, Avatar, Divider , Button
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LoginBar from "./LoginBar";
import ChannelsSidebar from "./ChannelsSidebar";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useSignalR } from "./SignalRProvider";
import api from "./api";

export default function ChatPage() {
    // ---------- ALL YOUR ORIGINAL STATE & HOOKS (unchanged) ----------
    const { connectionRef, connected, connect, disconnect } = useSignalR();
    const [currentUser, setCurrentUser] = useState({ id: "", name: "" });

    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [onlineUserIds, setOnlineUserIds] = useState([]);
    const [messagesMap, setMessagesMap] = useState({ public: [] });
    const [channel, setChannel] = useState({ type: "public", id: "" });
    const [messageText, setMessageText] = useState("");
    const [unreadUsers, setUnreadUsers] = useState({});
    const [unreadGroups, setUnreadGroups] = useState({});
    const [typingMap, setTypingMap] = useState({ private: {}, group: {} });
    const [newGroupName, setNewGroupName] = useState("");
    const [notice, setNotice] = useState(null);
    const usersRef = useRef(users);
    useEffect(() => { usersRef.current = users; }, [users]);
    const [pagination, setPagination] = useState({});

    // ---------- ALL YOUR ORIGINAL HELPER FUNCTIONS (copied exactly) ----------
    function pushMessage(key, text) {
        setMessagesMap(prev => {
            const updated = [...(prev[key] || []), text];
            return { ...prev, [key]: updated.slice(-10) };
        });
        const channelKey = channelKeyFor(channel);
        if (key !== channelKey) {
            if (key.startsWith("user:")) {
                const id = key.slice(5);
                setUnreadUsers(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            } else if (key.startsWith("group:")) {
                const id = key.slice(6);
                setUnreadGroups(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            }
        }
    }

    function channelKeyFor(ch) {
        if (!ch) return "public";
        if (ch.type === "public") return "public";
        if (ch.type === "private") return `user:${ch.id}`;
        return `group:${ch.id}`;
    }

    async function loadUsers() {
        try { const res = await api.get("/Users"); setUsers(res.data); } catch (err) { console.warn(err); }
    }
    async function loadGroups() {
        try { const res = await api.get("/Groups"); setGroups(res.data); } catch (err) { console.warn(err); }
    }

    async function loadPublicHistory(loadMore = false) {
        try {
            const key = "public";
            const skip = loadMore ? (pagination[key] || 0) : 0;
            const res = await api.get(`/Messages?take=10&skip=${skip}`);
            const newMsgs = res.data.map(i => formatMsg(i.timestamp, i.user, i.message));
            setMessagesMap(prev => ({
                ...prev,
                [key]: loadMore ? [...newMsgs, ...(prev[key] || [])] : newMsgs
            }));
            setPagination(prev => ({ ...prev, [key]: skip + 10 }));
        } catch (err) { console.warn(err); }
    }

    function formatMsg(ts, sender, txt) {
        try { return `${new Date(ts).toLocaleTimeString()} ${sender}: ${txt}`; } catch { return `${sender}: ${txt}`; }
    }

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
                setCurrentUser({ id: payload.sub ?? payload.nameid ?? "", name: payload.FullName ?? payload.name ?? payload.fullName ?? "" });
            } catch (e) { console.error("Error occurred:", e.message); }
            loadUsers(); loadGroups(); loadPublicHistory();

            connect(token).then((connection) => {
                const conn = connectionRef.current;
                if (!conn) return;
                conn.off("ReceiveMessage"); conn.off("ReceivePrivateMessage"); conn.off("ReceiveGroupMessage");
                conn.off("PresenceList"); conn.off("PresenceUpdated");
                conn.off("TypingPrivate"); conn.off("TypingGroup"); conn.off("GroupCreated");

                conn.on("ReceiveMessage", (userName, message, timestamp) => {
                    pushMessage("public", formatMsg(timestamp, userName, message));
                });
                conn.on("ReceivePrivateMessage", (senderId, senderName, message, timestamp) => {
                    pushMessage(`user:${senderId}`, formatMsg(timestamp, senderName, message));
                });
                conn.on("PrivateMessageSent", (targetId, senderName, message, timestamp) => {
                    pushMessage(`user:${targetId}`, formatMsg(timestamp, senderName, message));
                });
                conn.on("ReceiveGroupMessage", (groupId, senderName, message, timestamp) => {
                    pushMessage(`group:${groupId}`, formatMsg(timestamp, senderName, message));
                });
                conn.on("GroupCreated", (group) => {
                    if (!group) return;
                    setGroups(prev => prev.some(g => g.id === group.id) ? prev : [...prev, group]);
                    setUnreadGroups(prev => ({ ...prev, [group.id]: 0 }));
                });
                conn.on("PresenceList", (userIds) => { if (Array.isArray(userIds)) setOnlineUserIds(userIds); });
                conn.on("PresenceUpdated", (userId, online) => {
                    setOnlineUserIds(prev => {
                        const set = new Set(prev);
                        online ? set.add(userId) : set.delete(userId);
                        return Array.from(set);
                    });
                });
                conn.on("TypingPrivate", (senderName) => {
                    const found = usersRef.current.find(u => (u.fullName ?? u.email) === senderName);
                    const id = found ? found.id : `unknown:${senderName}`;
                    setTypingMap(prev => ({ ...prev, private: { ...(prev.private || {}), [id]: senderName } }));
                    setTimeout(() => setTypingMap(prev => { const p = { ...(prev.private || {}) }; delete p[id]; return { ...prev, private: p }; }), 3000);
                });
                conn.on("TypingGroup", (groupId, senderName) => {
                    setTypingMap(prev => ({ ...prev, group: { ...(prev.group || {}), [groupId]: senderName } }));
                    setTimeout(() => setTypingMap(prev => { const g = { ...(prev.group || {}) }; delete g[groupId]; return { ...prev, group: g }; }), 3000);
                });
            }).catch(e => console.warn(e));
        }
        return () => { };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const k = channelKeyFor(channel);
        if (k.startsWith("user:")) {
            const id = k.slice(5);
            setUnreadUsers(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            if (!messagesMap[k]) fetchPrivateHistory(id);
        } else if (k.startsWith("group:")) {
            const id = k.slice(6);
            setUnreadGroups(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            if (!messagesMap[k]) fetchGroupHistory(id);
        } else {
            if (!messagesMap.public || messagesMap.public.length === 0) loadPublicHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channel]);

    async function fetchPrivateHistory(otherUserId, loadMore = false) {
        try {
            const key = `user:${otherUserId}`;
            const skip = loadMore ? (pagination[key] || 0) : 0;
            const res = await api.get(`/Messages/private/${otherUserId}?take=10&skip=${skip}`);
            const newMsgs = res.data.map(i => formatMsg(i.timestamp, i.user, i.message));
            setMessagesMap(prev => ({
                ...prev,
                [key]: loadMore ? [...newMsgs, ...(prev[key] || [])] : newMsgs
            }));
            setPagination(prev => ({ ...prev, [key]: skip + 10 }));
        } catch (err) { console.warn(err); }
    }

    async function fetchGroupHistory(groupId, loadMore = false) {
        try {
            const key = `group:${groupId}`;
            const skip = loadMore ? (pagination[key] || 0) : 0;
            const res = await api.get(`/groups/${groupId}/messages?take=10&skip=${skip}`);
            const newMsgs = res.data.map(i => formatMsg(i.timestamp, i.senderName, i.message));
            setMessagesMap(prev => ({
                ...prev,
                [key]: loadMore ? [...newMsgs, ...(prev[key] || [])] : newMsgs
            }));
            setPagination(prev => ({ ...prev, [key]: skip + 10 }));
        } catch (err) { console.warn(err); }
    }

    async function sendMessage() {
        if (!connectionRef.current) { setNotice({ severity: "warning", message: "Not connected" }); return; }
        const text = messageText.trim();
        if (!text) return;
        try {
            if (channel.type === "public") await connectionRef.current.invoke("SendMessage", text);
            else if (channel.type === "private") await connectionRef.current.invoke("SendPrivateMessage", channel.id, text);
            else if (channel.type === "group") await connectionRef.current.invoke("SendGroupMessage", channel.id, text);
            setMessageText("");
        } catch (err) {
            console.warn(err);
            setNotice({ severity: "error", message: "Send error" });
        }
    }

    async function createGroup() {
        if (!newGroupName.trim()) return;
        try {
            await api.post("/Groups", newGroupName);
            await loadGroups();
            setNewGroupName("");
            setNotice({ severity: "success", message: "Group created" });
        } catch (err) {
            console.warn(err);
            setNotice({ severity: "error", message: "Create group failed" });
        }
    }

    async function joinGroup() {
        if (channel.type !== "group") return setNotice({ severity: "warning", message: "Select a group" });
        try {
            await connectionRef.current.invoke("JoinGroup", channel.id);
            setNotice({ severity: "info", message: "Joined group" });
        } catch (err) { console.warn(err); }
    }

    async function leaveGroup() {
        if (channel.type !== "group") return setNotice({ severity: "warning", message: "Select a group" });
        try {
            await connectionRef.current.invoke("LeaveGroup", channel.id);
            setNotice({ severity: "info", message: "Left group" });
        } catch (err) { console.warn(err); }
    }

    const channelKey = channelKeyFor(channel);
    const currentMessages = messagesMap[channelKey] || [];

    // ---------- RENDER WITH MODERN DESIGN ----------
    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "#f0f2f5" }}>
            <AppBar position="static" elevation={0} sx={{ bgcolor: "#fff", color: "text.primary", borderBottom: "1px solid", borderColor: "divider" }}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" sx={{ mr: 2, display: { sm: "none" } }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600, color: "#1a2b3c" }}>
                        💬 CleanChat
                    </Typography>
                    <LoginBar onConnectedUser={setCurrentUser} />
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ flexGrow: 1, py: 2, height: "calc(100% - 64px)" }}>
                <Box sx={{ display: "flex", gap: 2, height: "100%" }}>
                    {/* Sidebar */}
                    <Paper elevation={2} sx={{ width: 320, borderRadius: 3, overflow: "hidden" }}>
                        <ChannelsSidebar
                            users={users}
                            groups={groups}
                            onlineUserIds={onlineUserIds}
                            unreadUsers={unreadUsers}
                            unreadGroups={unreadGroups}
                            channel={channel}
                            setChannel={setChannel}
                            joinGroup={joinGroup}
                            leaveGroup={leaveGroup}
                            newGroupName={newGroupName}
                            setNewGroupName={setNewGroupName}
                            createGroup={createGroup}
                        />
                    </Paper>

                    {/* Chat area */}
                    <Paper elevation={2} sx={{ flex: 1, borderRadius: 3, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                        {/* Channel header */}
                        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#fafafa" }}>
                            <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                {channel.type === "public" && "🗣️ Public Chat"}
                                {channel.type === "private" && `👤 Private: ${users.find(u => u.id === channel.id)?.fullName ?? "User"}`}
                                {channel.type === "group" && `👥 Group: ${groups.find(g => g.id === channel.id)?.name ?? "Group"}`}
                            </Typography>
                        </Box>

                        {/* Load older messages button */}
                        <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
                            <Button
                                size="small"
                                variant="text"
                                sx={{ textTransform: "none", color: "primary.main" }}
                                startIcon={<span>↑</span>}
                                onClick={() => {
                                    if (channel.type === "public") loadPublicHistory(true);
                                    else if (channel.type === "private") fetchPrivateHistory(channel.id, true);
                                    else fetchGroupHistory(channel.id, true);
                                }}
                            >
                                Load older messages
                            </Button>
                        </Box>

                        {/* Message list */}
                        <MessageList messages={currentMessages} currentUser={currentUser} />

                        {/* Typing indicator */}
                        <Box sx={{ px: 2, minHeight: 28 }}>
                            {channel.type === "private" && typingMap.private[channel.id] && (
                                <Typography variant="caption" color="text.secondary">
                                    {typingMap.private[channel.id]} is typing...
                                </Typography>
                            )}
                            {channel.type === "group" && typingMap.group[channel.id] && (
                                <Typography variant="caption" color="text.secondary">
                                    {typingMap.group[channel.id]} is typing...
                                </Typography>
                            )}
                        </Box>

                        {/* Message input */}
                        <MessageInput
                            messageText={messageText}
                            setMessageText={setMessageText}
                            onSend={sendMessage}
                            placeholder={
                                channel.type === "public"
                                    ? "Message public chat..."
                                    : channel.type === "private"
                                        ? `Message ${users.find(u => u.id === channel.id)?.fullName ?? "user"}...`
                                        : "Message group..."
                            }
                            disabled={!connected}
                        />

                        {/* Refresh buttons (still functional, but visually subdued) */}
                        <Box sx={{ display: "flex", gap: 1, p: 1, borderTop: "1px solid", borderColor: "divider", bgcolor: "#fafafa", justifyContent: "center" }}>
                            <Button size="small" variant="outlined" onClick={() => { if (channel.type === "public") loadPublicHistory(); else if (channel.type === "private") fetchPrivateHistory(channel.id); else fetchGroupHistory(channel.id); }}>
                                Refresh Chat
                            </Button>
                            <Button size="small" variant="outlined" onClick={loadUsers}>Users</Button>
                            <Button size="small" variant="outlined" onClick={loadGroups}>Groups</Button>
                        </Box>
                    </Paper>
                </Box>
            </Container>

            <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}>
                {notice && <Alert onClose={() => setNotice(null)} severity={notice.severity}>{notice.message}</Alert>}
            </Snackbar>
        </Box>
    );
}