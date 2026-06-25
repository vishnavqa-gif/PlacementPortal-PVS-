import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, Link, CircularProgress, InputAdornment
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { authApi } from '../../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0D47A1, #1976D2)', p: 2 }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>🎯 Placement Portal</Typography>
        </Box>

        <Card elevation={0} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {sent ? (
              <Box textAlign="center">
                <Typography variant="h2" mb={2}>📧</Typography>
                <Typography variant="h6" fontWeight={700} mb={1}>Check Your Email</Typography>
                <Typography color="text.secondary" mb={3}>
                  If an account exists with <strong>{email}</strong>, a password reset link has been sent.
                </Typography>
                <Button component={RouterLink} to="/login" variant="outlined" startIcon={<ArrowBack />}>
                  Back to Login
                </Button>
              </Box>
            ) : (
              <>
                <Typography variant="h5" fontWeight={700} mb={1}>Forgot Password</Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  Enter your email address and we'll send you a reset link.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth label="Email Address" type="email" required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    sx={{ mb: 3 }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Email color="action" /></InputAdornment> }}
                  />
                  <Button type="submit" fullWidth variant="contained" size="large" disabled={loading} sx={{ py: 1.5, mb: 2 }}>
                    {loading ? <CircularProgress size={22} color="inherit" /> : 'Send Reset Link'}
                  </Button>
                </form>

                <Button component={RouterLink} to="/login" startIcon={<ArrowBack />} fullWidth>
                  Back to Login
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
