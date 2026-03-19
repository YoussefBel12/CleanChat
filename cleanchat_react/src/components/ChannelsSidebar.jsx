/*
import React from "react";
import {
    Box, Typography, Button, Divider, FormControl, InputLabel,
    Select, MenuItem, TextField, IconButton, Avatar, Badge
} from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";

export default function ChannelsSidebar({
    users, groups, onlineUserIds,
    unreadUsers, unreadGroups,
    channel, setChannel,
    joinGroup, leaveGroup,
    newGroupName, setNewGroupName, createGroup
}) {
    return (
        <Box sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PersonIcon sx={{ mr: 1 }} /><Typography variant="subtitle1">Channels</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between', width: '100%' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Avatar sx={{ width: 28, height: 28 }}>{(u.fullName ?? u.email)[0]?.toUpperCase()}</Avatar>
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
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between', width: '100%' }}>
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
                <Button variant="outlined" onClick={joinGroup} disabled={channel.type !== 'group'}>Join</Button>
                <Button variant="outlined" onClick={leaveGroup} disabled={channel.type !== 'group'}>Leave</Button>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                <TextField size="small" placeholder="New group" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} fullWidth />
                <IconButton color="primary" onClick={createGroup}><GroupAddIcon /></IconButton>
            </Box>
        </Box>
    );
}
*/


// VERSION 2 BELOW ONLY WORK WITH V2 COMPONENTS
import React from "react";
import {
    Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Badge, Avatar, Divider, TextField, Button, Typography, Stack
} from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

// Online indicator badge
const OnlineBadge = ({ online, children }) => (
    <Badge
        overlap="circular"
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        variant="dot"
        color={online ? "success" : "default"}
        sx={{ "& .MuiBadge-badge": { width: 10, height: 10, borderRadius: "50%" } }}
    >
        {children}
    </Badge>
);

export default function ChannelsSidebar({
    users, groups, onlineUserIds,
    unreadUsers, unreadGroups,
    channel, setChannel,
    joinGroup, leaveGroup,
    newGroupName, setNewGroupName, createGroup
}) {
    return (
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fff" }}>
            <List sx={{ flex: 1, overflow: "auto", py: 0 }}>
                {/* Public channel */}
                <ListItem disablePadding>
                    <ListItemButton
                        selected={channel.type === "public"}
                        onClick={() => setChannel({ type: "public", id: "" })}
                    >
                        <ListItemIcon><PublicIcon color="primary" /></ListItemIcon>
                        <ListItemText primary="Public Chat" />
                    </ListItemButton>
                </ListItem>

                <Divider sx={{ my: 1 }} />

                {/* Users section */}
                <Typography variant="caption" sx={{ px: 2, color: "text.secondary" }}>DIRECT MESSAGES</Typography>
                {users.map(user => {
                    const online = onlineUserIds.includes(user.id);
                    const unread = unreadUsers[user.id] || 0;
                    return (
                        <ListItem key={user.id} disablePadding>
                            <ListItemButton
                                selected={channel.type === "private" && channel.id === user.id}
                                onClick={() => setChannel({ type: "private", id: user.id })}
                            >
                                <ListItemIcon>
                                    <OnlineBadge online={online}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: online ? "#4caf50" : "#bdbdbd" }}>
                                            {user.fullName?.charAt(0) || "?"}
                                        </Avatar>
                                    </OnlineBadge>
                                </ListItemIcon>
                                <ListItemText primary={user.fullName ?? user.email} />
                                {unread > 0 && (
                                    <Badge badgeContent={unread} color="primary" sx={{ mr: 1 }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}

                <Divider sx={{ my: 1 }} />

                {/* Groups section */}
                <Typography variant="caption" sx={{ px: 2, color: "text.secondary" }}>GROUPS</Typography>
                {groups.map(group => {
                    const unread = unreadGroups[group.id] || 0;
                    return (
                        <ListItem key={group.id} disablePadding>
                            <ListItemButton
                                selected={channel.type === "group" && channel.id === group.id}
                                onClick={() => setChannel({ type: "group", id: group.id })}
                            >
                                <ListItemIcon><GroupIcon /></ListItemIcon>
                                <ListItemText primary={group.name} />
                                {unread > 0 && (
                                    <Badge badgeContent={unread} color="primary" sx={{ mr: 1 }} />
                                )}
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* Group actions and creation */}
            <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <Button variant="outlined" size="small" fullWidth onClick={joinGroup} disabled={channel.type !== "group"}>
                        Join
                    </Button>
                    <Button variant="outlined" size="small" fullWidth onClick={leaveGroup} disabled={channel.type !== "group"}>
                        Leave
                    </Button>
                </Stack>
                <TextField
                    size="small"
                    fullWidth
                    placeholder="New group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    sx={{ mb: 1 }}
                />
                <Button variant="contained" size="small" fullWidth onClick={createGroup} startIcon={<GroupAddIcon />}>
                    Create Group
                </Button>
            </Box>
        </Box>
    );
}