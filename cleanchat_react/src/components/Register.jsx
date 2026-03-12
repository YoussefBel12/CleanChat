/*
import React, { useState } from 'react';
import api from './api'; // Your Axios instance

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Identity usually expects these fields
            const response = await api.post('/Auth/register', formData);
            // Use it here!
            console.log("Server Response:", response.data); 
            alert("Registration successful! Please login.");
        } catch (err) {
            console.error(err.response?.data || "Registration failed");
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>
            <input name="fullName" placeholder="Full Name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
            <input name="confirmPassword" type="password" placeholder="Confirm Password" onChange={handleChange} required />
            <button type="submit">Sign Up</button>
        </form>
    );
};



export default Register;

REGISTER WITHOUT MATERIELUI
*/


import React, { useState } from 'react';
import {
    TextField, Button, Container, Typography, Box, Paper,
    Avatar, Grid, Link, InputAdornment, IconButton, CircularProgress
} from '@mui/material';
import { PersonAddOutlined, Visibility, VisibilityOff, Email, Lock, Badge } from '@mui/icons-material';
import api from './api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '', email: '', password: '', confirmPassword: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/Auth/register', formData);
            alert("Account created! Redirecting to login...");
            navigate('/login');
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Container maxWidth="sm">
                <Paper elevation={10} sx={{ p: { xs: 3, md: 6 }, borderRadius: 4 }}>
                    <Box display="flex" flexDirection="column" alignItems="center">
                        <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
                            <PersonAddOutlined fontSize="large" />
                        </Avatar>
                        <Typography variant="h4" fontWeight="800" gutterBottom>Create Account</Typography>
                        <Typography variant="body2" color="textSecondary" mb={3}>Join our community today</Typography>

                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Full Name" name="fullName" onChange={handleChange} required
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Badge color="action" /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField fullWidth label="Email Address" name="email" type="email" onChange={handleChange} required
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Password" name="password" onChange={handleChange} required
                                        type={showPassword ? 'text' : 'password'}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Lock color="action" /></InputAdornment>,
                                            endAdornment: <InputAdornment position="end">
                                                <IconButton onClick={() => setShowPassword(!showPassword)}><>{showPassword ? <VisibilityOff /> : <Visibility />}</></IconButton>
                                            </InputAdornment>
                                        }} />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Confirm" name="confirmPassword" type="password" onChange={handleChange} required />
                                </Grid>
                            </Grid>
                            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 4, py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}>
                                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
                            </Button>
                            <Box mt={3} textAlign="center">
                                <Link href="/login" underline="hover">Already have an account? Log In</Link>
                            </Box>
                        </form>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Register;
