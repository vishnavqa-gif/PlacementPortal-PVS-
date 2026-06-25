import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Grid, Link, CircularProgress, InputAdornment
} from '@mui/material';
import { Person, Email, Lock, Phone } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authApi } from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D47A1, #1976D2)', p: 2 }}>
        <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h2" mb={2}>🎉</Typography>
            <Typography variant="h5" fontWeight={700} mb={1}>Registration Successful!</Typography>
            <Typography color="text.secondary">Redirecting to login...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D47A1, #1976D2)', p: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 500 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>🎯 Placement Portal</Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>Create your student account</Typography>
        </Box>

        <Card elevation={0} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" fontWeight={700} mb={3}>Student Registration</Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="First Name" required
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Person fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="Last Name" required
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Email Address" type="email" required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Phone Number"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Phone fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="Password" type="password" required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Lock fontSize="small" /></InputAdornment> }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth label="Confirm Password" type="password" required
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5 }}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
                  </Button>
                </Grid>
              </Grid>
            </form>

            <Typography variant="body2" textAlign="center" mt={2}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>Sign In</Link>
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Register;
