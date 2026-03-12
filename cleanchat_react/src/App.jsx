
/*
import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as signalR from '@microsoft/signalr';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Grid,
    Paper,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    IconButton,
    Divider,
    Snackbar,
    Alert,
    Avatar,
    ThemeProvider,
    createTheme,
    Badge,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';

const theme = createTheme({
    palette: {
        primary: { main: '#2e7d32' }, // green
        secondary: { main: '#a5d6a7' },
    },
});

function parseJwt(token) {
    try {
        const p = token.split('.')[1];
        const decoded = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
        return decoded;
    } catch {
        return {};
    }
}

export default function App() {
    const [email, setEmail] = useState('manal@gmail.com');
    const [password, setPassword] = useState('Manal123&');

    const [users, setUsers] = useState([]);
    const [groups, setGroups] = useState([]);

    const [currentUser, setCurrentUser] = useState({ id: '', name: '' });

    const [channel, setChannel] = useState({ type: 'public', id: '' });
    const [messages, setMessages] = useState(() => ({ public: [] }));

    const [connected, setConnected] = useState(false);
    const [notice, setNotice] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [messageText, setMessageText] = useState('');

    const connectionRef = useRef(null);
    const usersRef = useRef(users);
    const groupsRef = useRef(groups);
    useEffect(() => { usersRef.current = users; }, [users]);
    useEffect(() => { groupsRef.current = groups; }, [groups]);

    // presence, typing, unread states
    const [onlineUserIds, setOnlineUserIds] = useState([]); // presence
    const [typingMap, setTypingMap] = useState({ private: {}, group: {} }); // { private: {userId: name}, group: {groupId: name} }
    const [unreadUsers, setUnreadUsers] = useState({}); // { userId: count }
    const [unreadGroups, setUnreadGroups] = useState({}); // { groupId: count }

    const channelKey = useMemo(() => {
        if (channel.type === 'public') return 'public';
        if (channel.type === 'private') return `user:${channel.id}`;
        return `group:${channel.id}`;
    }, [channel]);

    // update unread counters when messages arrive and channel isn't active
    function pushMessage(key, text) {
        setMessages(prev => {
            const copy = { ...prev };
            if (!copy[key]) copy[key] = [];
            copy[key] = [...copy[key], text];
            return copy;
        });

        // increment unread if not currently viewed channel
        if (key !== channelKey) {
            if (key.startsWith('user:')) {
                const id = key.slice(5);
                setUnreadUsers(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            } else if (key.startsWith('group:')) {
                const id = key.slice(6);
                setUnreadGroups(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
            } else if (key === 'public') {
                // optional: unread for public (not implemented UI-wise)
            }
        }
    }

    function clearUnreadForKey(key) {
        if (key.startsWith('user:')) {
            const id = key.slice(5);
            setUnreadUsers(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        } else if (key.startsWith('group:')) {
            const id = key.slice(6);
            setUnreadGroups(prev => {
                const copy = { ...prev };
                delete copy[id];
                return copy;
            });
        }
    }

    function formatMsg(ts, sender, txt) {
        try { return `${new Date(ts).toLocaleTimeString()} ${sender}: ${txt}`; }
        catch { return `${sender}: ${txt}`; }
    }

    // ---------------- API fetch helpers ----------------
    async function fetchUsers(token = localStorage.getItem('token')) {
        if (!token) return;
        try {
            const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setUsers(await res.json());
        } catch (err) {
            console.warn('fetchUsers failed', err);
        }
    }

    async function fetchGroups(token = localStorage.getItem('token')) {
        if (!token) return;
        try {
            const res = await fetch('/api/groups', { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setGroups(await res.json());
        } catch (err) {
            console.warn('fetchGroups failed', err);
        }
    }

    async function fetchPublicHistory() {
        try {
            const res = await fetch('/api/messages');
            if (!res.ok) return;
            const items = await res.json();
            setMessages(prev => ({ ...prev, public: items.map(i => formatMsg(i.timestamp, i.user, i.message)) }));
        } catch (err) {
            console.warn('fetchPublicHistory failed', err);
        }
    }

    async function fetchPrivateHistory(otherUserId) {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch(`/api/messages/private/${otherUserId}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) return;
            const items = await res.json();
            const key = `user:${otherUserId}`;
            setMessages(prev => ({ ...prev, [key]: items.map(i => formatMsg(i.timestamp, i.user, i.message)) }));
            // clear unread for that conversation
            setUnreadUsers(prev => { const copy = { ...prev }; delete copy[otherUserId]; return copy; });
        } catch (err) {
            console.warn('fetchPrivateHistory failed', err);
        }
    }

    async function fetchGroupHistory(groupId) {
        try {
            const res = await fetch(`/api/groups/${groupId}/messages`);
            if (!res.ok) return;
            const items = await res.json();
            const key = `group:${groupId}`;
            setMessages(prev => ({ ...prev, [key]: items.map(i => formatMsg(i.timestamp, i.senderName, i.message)) }));
            // clear unread for that group
            setUnreadGroups(prev => { const copy = { ...prev }; delete copy[groupId]; return copy; });
        } catch (err) {
            console.warn('fetchGroupHistory failed', err);
        }
    }
    // ---------------------------------------------------

    // typing debounce
    const typingTimerRef = useRef(null);
    function sendTypingSignal() {
        if (!connectionRef.current) return;
        if (channel.type === 'private' && channel.id) {
            connectionRef.current.invoke('TypingPrivate', channel.id).catch(() => { });
        } else if (channel.type === 'group' && channel.id) {
            connectionRef.current.invoke('TypingGroup', channel.id).catch(() => { });
        }
    }

    // connect + handlers
    async function connectWithToken(token) {
        if (!token) return;
        try {
            if (connectionRef.current) {
                try { await connectionRef.current.stop(); } catch (err) { console.warn('stop previous connection failed', err); }
                connectionRef.current = null;
                setConnected(false);
            }

            const connection = new signalR.HubConnectionBuilder()
                .withUrl('/chatHub', { accessTokenFactory: () => localStorage.getItem('token') })
                .withAutomaticReconnect()
                .build();

            connection.on('ReceiveMessage', (userName, message, timestamp) => {
                pushMessage('public', formatMsg(timestamp, userName, message));
            });

            connection.on('ReceivePrivateMessage', (...args) => {
                let senderId, senderName, message, timestamp;
                if (args.length === 4) {
                    [senderId, senderName, message, timestamp] = args;
                } else if (args.length === 3) {
                    [senderName, message, timestamp] = args;
                    const found = usersRef.current.find(u => (u.fullName ?? u.email) === senderName);
                    senderId = found ? found.id : `unknown:${senderName}`;
                } else return;

                const key = `user:${senderId}`;
                pushMessage(key, formatMsg(timestamp, senderName, message));
            });

            connection.on('PrivateMessageSent', (...args) => {
                let targetId, senderName, message, timestamp;
                if (args.length === 4) {
                    [targetId, senderName, message, timestamp] = args;
                } else if (args.length === 3) {
                    [targetId, message, timestamp] = args;
                    const me = usersRef.current.find(u => u.id === targetId);
                    senderName = me ? me.fullName ?? me.email : 'You';
                } else return;

                const key = `user:${targetId}`;
                pushMessage(key, formatMsg(timestamp, senderName, message));
            });

            connection.on('ReceiveGroupMessage', (groupId, senderName, message, timestamp) => {
                const key = `group:${groupId}`;
                pushMessage(key, formatMsg(timestamp, senderName, message));
            });

            // Group created -> refresh groups state (real-time)
            connection.on('GroupCreated', (group) => {
                if (!group) return;
                const newGroup = typeof group === 'object' && group.id ? group : (Array.isArray(group) ? { id: group[0], name: group[1] } : null);
                if (!newGroup) return;
                setGroups(prev => {
                    if (prev.some(g => g.id === newGroup.id)) return prev;
                    return [...prev, newGroup];
                });
                // initialize unread counter
                setUnreadGroups(prev => ({ ...prev, [newGroup.id]: 0 }));
            });

            // presence
            connection.on('PresenceList', (userIds) => {
                if (!Array.isArray(userIds)) return;
                setOnlineUserIds(userIds);
            });
            connection.on('PresenceUpdated', (userId, online) => {
                setOnlineUserIds(prev => {
                    const set = new Set(prev);
                    if (online) set.add(userId); else set.delete(userId);
                    return Array.from(set);
                });
            });

            // typing indicators
            connection.on('TypingPrivate', (senderName) => {
                // mark typing for that sender; try to resolve id from usersRef
                const found = usersRef.current.find(u => (u.fullName ?? u.email) === senderName);
                const id = found ? found.id : `unknown:${senderName}`;
                setTypingMap(prev => ({ ...prev, private: { ...(prev.private || {}), [id]: senderName } }));
                // clear after 3s
                setTimeout(() => setTypingMap(prev => { const p = { ...(prev.private || {}) }; delete p[id]; return { ...prev, private: p }; }), 3000);
            });

            connection.on('TypingGroup', (groupId, senderName) => {
                setTypingMap(prev => ({ ...prev, group: { ...(prev.group || {}), [groupId]: senderName } }));
                setTimeout(() => setTypingMap(prev => { const g = { ...(prev.group || {}) }; delete g[groupId]; return { ...prev, group: g }; }), 3000);
            });

            connection.on('GroupNotification', (text) => {
                setNotice({ severity: 'info', message: text });
            });

            connectionRef.current = connection;
            await connection.start();
            setConnected(true);
            setNotice({ severity: 'success', message: 'Connected to SignalR' });
        } catch (err) {
            console.warn('connectWithToken error', err);
            setNotice({ severity: 'error', message: `Connect error: ${String(err)}` });
        }
    }

    // initial load: auto-connect if token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const payload = parseJwt(token);
            setCurrentUser({ id: payload.sub ?? payload.nameid ?? '', name: payload.FullName ?? payload.name ?? payload.fullName ?? '' });
            fetchUsers(token).catch(e => console.warn(e));
            fetchGroups(token).catch(e => console.warn(e));
            fetchPublicHistory().catch(e => console.warn(e));
            connectWithToken(token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Login -> store token -> connect
    async function loginAndConnect() {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })
            });
            if (!res.ok) { setNotice({ severity: 'error', message: `Login failed: ${res.status}` }); return; }
            const json = await res.json();
            const token = json.token ?? json.accessToken ?? json.jwt ?? json.tokenValue;
            if (!token) { setNotice({ severity: 'error', message: 'No token returned' }); return; }
            localStorage.setItem('token', token);
            const payload = parseJwt(token);
            setCurrentUser({ id: payload.sub ?? payload.nameid ?? '', name: payload.FullName ?? payload.name ?? payload.fullName ?? '' });

            await fetchUsers(token);
            await fetchGroups(token);
            await fetchPublicHistory();
            await connectWithToken(token);
        } catch (err) {
            console.warn('loginAndConnect error', err);
            setNotice({ severity: 'error', message: `Login error: ${String(err)}` });
        }
    }

    async function logout() {
        try {
            localStorage.removeItem('token');
            if (connectionRef.current) {
                await connectionRef.current.stop();
                connectionRef.current = null;
            }
        } catch (err) {
            console.warn('logout error', err);
        } finally {
            setConnected(false);
            setUsers([]);
            setGroups([]);
            setMessages({ public: [] });
            setCurrentUser({ id: '', name: '' });
            setNotice({ severity: 'info', message: 'Logged out' });
        }
    }

    // unified send
    async function sendMessage() {
        if (!connectionRef.current) { setNotice({ severity: 'warning', message: 'Not connected' }); return; }
        const text = messageText.trim();
        if (!text) return;
        try {
            if (channel.type === 'public') {
                await connectionRef.current.invoke('SendMessage', text);
            } else if (channel.type === 'private') {
                await connectionRef.current.invoke('SendPrivateMessage', channel.id, text);
            } else if (channel.type === 'group') {
                await connectionRef.current.invoke('SendGroupMessage', channel.id, text);
            }
            setMessageText('');
        } catch (err) {
            console.warn('sendMessage error', err);
            setNotice({ severity: 'error', message: `Send error: ${String(err)}` });
        }
    }

    async function createGroup() {
        const token = localStorage.getItem('token');
        if (!token) { setNotice({ severity: 'warning', message: 'Not authenticated' }); return; }
        if (!newGroupName.trim()) { setNotice({ severity: 'warning', message: 'Group name required' }); return; }
        try {
            const res = await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(newGroupName) });
            if (res.ok) {
                await fetchGroups(token);
                setNewGroupName('');
                setNotice({ severity: 'success', message: 'Group created' });
            } else if (res.status === 403) {
                setNotice({ severity: 'error', message: 'Forbidden: need GroupAdmin role' });
            } else {
                setNotice({ severity: 'error', message: `Create group failed: ${res.status}` });
            }
        } catch (err) {
            console.warn('createGroup error', err);
            setNotice({ severity: 'error', message: `Create group error: ${String(err)}` });
        }
    }

    async function joinGroup() {
        if (channel.type !== 'group' || !channel.id) { setNotice({ severity: 'warning', message: 'Select a group' }); return; }
        if (!connectionRef.current) { setNotice({ severity: 'warning', message: 'Not connected' }); return; }
        try {
            await connectionRef.current.invoke('JoinGroup', channel.id);
            setNotice({ severity: 'info', message: 'Joined group' });
        } catch (err) {
            console.warn('joinGroup error', err);
            setNotice({ severity: 'error', message: `Join group error: ${String(err)}` });
        }
    }

    async function leaveGroup() {
        if (channel.type !== 'group' || !channel.id) { setNotice({ severity: 'warning', message: 'Select a group' }); return; }
        if (!connectionRef.current) { setNotice({ severity: 'warning', message: 'Not connected' }); return; }
        try {
            await connectionRef.current.invoke('LeaveGroup', channel.id);
            setNotice({ severity: 'info', message: 'Left group' });
        } catch (err) {
            console.warn('leaveGroup error', err);
            setNotice({ severity: 'error', message: `Leave group error: ${String(err)}` });
        }
    }

    // when switching channel, clear unread for that channel
    useEffect(() => {
        clearUnreadForKey(channelKey);
        // load history for newly selected channel if not present
        if (channel.type === 'private' && channel.id) fetchPrivateHistory(channel.id);
        if (channel.type === 'group' && channel.id) fetchGroupHistory(channel.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [channelKey]);

    // typing handler (send signals)
    useEffect(() => {
        if (!connectionRef.current) return;
        if (messageText.trim() === '') return;
        // debounce typing signal
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            sendTypingSignal();
            typingTimerRef.current = null;
        }, 400);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messageText]);

    const currentMessages = messages[channelKey] ?? [];

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                <AppBar position="static" color="primary">
                    <Toolbar>
                        <GroupIcon sx={{ mr: 1 }} />
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>CleanChat</Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
                            {currentUser.name ? <Typography variant="body2" sx={{ opacity: 0.9 }}>Signed in as {currentUser.name}</Typography> : null}
                        </Box>

                        <TextField size="small" placeholder="email" value={email} onChange={e => setEmail(e.target.value)} sx={{ mr: 1, bgcolor: 'background.paper', borderRadius: 1 }} />
                        <TextField size="small" placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} sx={{ mr: 1, bgcolor: 'background.paper', borderRadius: 1 }} />

                        {connected
                            ? <Button color="inherit" onClick={logout}>Logout</Button>
                            : <Button color="inherit" onClick={loginAndConnect}>Login & Connect</Button>
                        }
                    </Toolbar>
                </AppBar>

                <Container maxWidth="xl" sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
                    <Grid container spacing={2} sx={{ height: 'calc(100% - 16px)' }}>
                        <Grid item xs={3}>
                            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="subtitle1">Channels</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />

                                <Typography variant="subtitle2">Public</Typography>
                                <Button fullWidth sx={{ mb: 1 }} variant={channel.type === 'public' ? 'contained' : 'outlined'} onClick={() => setChannel({ type: 'public', id: '' })}>Public Chat</Button>

                                <Typography variant="subtitle2" sx={{ mt: 1 }}>Users</Typography>
                                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                    <InputLabel id="user-select-label">Private chat</InputLabel>
                                    <Select
                                        labelId="user-select-label"
                                        value={channel.type === 'private' ? channel.id : ''}
                                        label="Private chat"
                                        onChange={e => setChannel({ type: e.target.value ? 'private' : 'public', id: e.target.value })}
                                    >
                                        <MenuItem value=""><em>Choose user</em></MenuItem>
                                        {users.map(u => {
                                            const unread = unreadUsers[u.id] || 0;
                                            const online = onlineUserIds.includes(u.id);
                                            return (
                                                <MenuItem key={u.id} value={u.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light' }}>
                                                                {(u.fullName ?? u.email)[0]?.toUpperCase()}
                                                            </Avatar>
                                                            <span>{u.fullName ?? u.email}</span>
                                                            {online && <Box component="span" sx={{ width: 8, height: 8, bgcolor: 'green', borderRadius: '50%', ml: 1 }} />}
                                                        </Box>
                                                        {unread > 0 && <Badge color="secondary" badgeContent={unread} />}
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>

                                <Typography variant="subtitle2" sx={{ mt: 1 }}>Groups</Typography>
                                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                                    <InputLabel id="group-select-label">Group</InputLabel>
                                    <Select
                                        labelId="group-select-label"
                                        value={channel.type === 'group' ? channel.id : ''}
                                        label="Group"
                                        onChange={e => setChannel({ type: e.target.value ? 'group' : 'public', id: e.target.value })}
                                    >
                                        <MenuItem value=""><em>Choose group</em></MenuItem>
                                        {groups.map(g => {
                                            const unread = unreadGroups[g.id] || 0;
                                            return (
                                                <MenuItem key={g.id} value={g.id}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%', justifyContent: 'space-between' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <GroupIcon sx={{ color: 'primary.dark' }} />
                                                            <span>{g.name}</span>
                                                        </Box>
                                                        {unread > 0 && <Badge color="secondary" badgeContent={unread} />}
                                                    </Box>
                                                </MenuItem>
                                            );
                                        })}
                                    </Select>
                                </FormControl>

                                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                    <Button variant="outlined" onClick={joinGroup} disabled={!connected || channel.type !== 'group'}>Join</Button>
                                    <Button variant="outlined" onClick={leaveGroup} disabled={!connected || channel.type !== 'group'}>Leave</Button>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                                    <TextField size="small" placeholder="New group" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} fullWidth />
                                    <IconButton color="primary" onClick={createGroup}><GroupAddIcon /></IconButton>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid item xs={9}>
                            <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h6" sx={{ mb: 1 }}>
                                    {channel.type === 'public' && 'Public Chat'}
                                    {channel.type === 'private' && `Private: ${users.find(u => u.id === channel.id)?.fullName ?? 'Private Chat'}`}
                                    {channel.type === 'group' && `Group: ${groups.find(g => g.id === channel.id)?.name ?? 'Group'}`}
                                </Typography>

                                <List sx={{ flexGrow: 1, overflow: 'auto', mb: 1, bgcolor: 'background.paper' }}>
                                    {currentMessages.length === 0 && <ListItem><ListItemText primary="No messages yet" /></ListItem>}
                                    {currentMessages.map((m, i) => <ListItem key={i} divider><ListItemText primary={m} /></ListItem>)}
                                </List>

                            
                                <Box sx={{ minHeight: 24, mb: 1 }}>
                                    {channel.type === 'private' && typingMap.private[channel.id] && (
                                        <Typography variant="caption" color="textSecondary">{typingMap.private[channel.id]} is typing...</Typography>
                                    )}
                                    {channel.type === 'group' && typingMap.group[channel.id] && (
                                        <Typography variant="caption" color="textSecondary">{typingMap.group[channel.id]} is typing...</Typography>
                                    )}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder={channel.type === 'public' ? 'Message public chat...' : channel.type === 'private' ? `Message ${users.find(u => u.id === channel.id)?.fullName ?? 'user'}...` : `Message group...`}
                                        value={messageText}
                                        onChange={e => setMessageText(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                                    />
                                    <Button variant="contained" endIcon={<SendIcon />} onClick={sendMessage} disabled={!connected} sx={{ bgcolor: 'primary.main' }}>Send</Button>
                                </Box>

                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                    <Button onClick={() => { if (channel.type === 'public') fetchPublicHistory(); else if (channel.type === 'private') fetchPrivateHistory(channel.id); else fetchGroupHistory(channel.id); }}>Refresh</Button>
                                    <Button onClick={() => fetchUsers(localStorage.getItem('token'))}>Refresh Users</Button>
                                    <Button onClick={() => fetchGroups(localStorage.getItem('token'))}>Refresh Groups</Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>

                <Snackbar open={!!notice} autoHideDuration={4000} onClose={() => setNotice(null)}>
                    {notice && <Alert onClose={() => setNotice(null)} severity={notice.severity} sx={{ width: '100%' }}>{notice.message}</Alert>}
                </Snackbar>
            </Box>
        </ThemeProvider>
    );
}


*/