/*
import React, { useState } from 'react';
import { TextField, Button, Container, Typography, Box, Paper, Avatar, InputAdornment, IconButton, Link, CircularProgress } from '@mui/material';
import { LockOutlined, Visibility, VisibilityOff, MailOutline } from '@mui/icons-material';
import api from './api';
//for navigation after login
import { useNavigate } from 'react-router-dom';
const Login = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    //added navigation
    const navigate = useNavigate();
 


    const handleChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/Auth/login', credentials);
            localStorage.setItem('token', response.data.token);
           
            // after success
            navigate("/");
        } catch (err) {
            alert("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <Container maxWidth="xs">
                <Paper elevation={12} sx={{ p: 5, borderRadius: 5, textAlign: 'center' }}>
                    <Avatar sx={{ m: '0 auto 20px', bgcolor: 'secondary.main', width: 60, height: 60 }}>
                        <LockOutlined fontSize="large" />
                    </Avatar>
                    <Typography variant="h4" fontWeight="900" gutterBottom>Welcome</Typography>
                    <Typography variant="body1" color="textSecondary" mb={4}>Login to your account</Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField margin="normal" fullWidth label="Email" name="email" onChange={handleChange} required autoFocus
                            InputProps={{ startAdornment: <InputAdornment position="start"><MailOutline /></InputAdornment> }} />

                        <TextField margin="normal" fullWidth label="Password" name="password" onChange={handleChange} required
                            type={showPassword ? 'text' : 'password'}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><LockOutlined /></InputAdornment>,
                                endAdornment: <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)}>{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton>
                                </InputAdornment>
                            }} />

                        <Button type="submit" fullWidth variant="contained" disabled={loading}
                            sx={{ mt: 4, py: 1.8, borderRadius: '50px', fontSize: '1.1rem', boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)' }}>
                            {loading ? <CircularProgress size={26} color="inherit" /> : "Sign In"}
                        </Button>

                        <Box mt={4}>
                            <Link href="/register" sx={{ fontWeight: '500' }}>Create a new account</Link>
                        </Box>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
*/


import React, { useState } from 'react';
import {
    TextField, Button, Container, Typography, Box, Paper,
    Avatar, InputAdornment, IconButton, Link, CircularProgress
} from '@mui/material';
import { LockOutlined, Visibility, VisibilityOff, MailOutline } from '@mui/icons-material';
import api from './api';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [credentials, setCredentials] = useState({ email: '', password: '' });

    const navigate = useNavigate();

    const handleChange = (e) =>
        setCredentials({ ...credentials, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/Auth/login', credentials);
            localStorage.setItem('token', response.data.token);

            navigate('/');
        } catch (err) {
            alert("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                width: "100vw",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}
        >
            <Container maxWidth="xs">
                <Paper elevation={12} sx={{ p: 5, borderRadius: 5, textAlign: 'center' }}>
                    <Avatar sx={{ m: '0 auto 20px', bgcolor: 'secondary.main', width: 60, height: 60 }}>
                        <LockOutlined fontSize="large" />
                    </Avatar>

                    <Typography variant="h4" fontWeight="900" gutterBottom>
                        Welcome To CleanChat
                    </Typography>

                    <Typography variant="body1" color="text.secondary" mb={4}>
                        Login to your account
                    </Typography>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Email"
                            name="email"
                            onChange={handleChange}
                            required
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <MailOutline />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            margin="normal"
                            fullWidth
                            label="Password"
                            name="password"
                            onChange={handleChange}
                            required
                            type={showPassword ? 'text' : 'password'}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{
                                mt: 4,
                                py: 1.8,
                                borderRadius: '50px',
                                fontSize: '1.1rem'
                            }}
                        >
                            {loading ? <CircularProgress size={26} color="inherit" /> : "Sign In"}
                        </Button>

                        <Box mt={4}>
                            <Link href="/register" underline="hover">
                                Create a new account
                            </Link>
                        </Box>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
