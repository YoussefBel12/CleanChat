
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