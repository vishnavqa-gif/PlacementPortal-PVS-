import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Snackbar, Chip, IconButton, Tooltip
} from '@mui/material';
import { Add, Delete, AccessTime } from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const AdminSlots = () => {
  const [slots, setSlots] = useState<any[]>([]);
  const [dialog, setDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ start_time: '', end_time: '', label: '' });

  const load = () => {
    setLoading(true);
    adminApi.listSlots().then(r => setSlots(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setError('');
    setSubmitting(true);
    try {
      const label = form.label || `${formatTime(form.start_time)} - ${formatTime(form.end_time)}`;
      await adminApi.createSlot({ ...form, label });
      setSnack('Time slot created!');
      setDialog(false);
      setForm({ start_time: '', end_time: '', label: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create slot');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteSlot(id);
      setSnack('Slot deleted.');
      load();
    } catch { setSnack('Failed to delete slot'); }
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Time Slots</Typography>
            <Typography color="text.secondary">Manage available interview time slots</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>Add Slot</Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <Grid container spacing={2}>
            {slots.map((s: any) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={s.id}>
                <Card sx={{
                  border: '2px solid',
                  borderColor: s.is_active ? 'primary.light' : 'grey.300',
                  opacity: s.is_active ? 1 : 0.6,
                }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime color={s.is_active ? 'primary' : 'disabled'} />
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {s.label || `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(s.start_time)} → {formatTime(s.end_time)}
                          </Typography>
                        </Box>
                      </Box>
                      <Tooltip title="Delete slot">
                        <IconButton size="small" color="error" onClick={() => handleDelete(s.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Box mt={1.5}>
                      <Chip
                        label={s.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={s.is_active ? 'success' : 'default'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}

            {slots.length === 0 && (
              <Grid item xs={12}>
                <Box textAlign="center" py={6}>
                  <AccessTime sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                  <Typography color="text.secondary">No time slots configured</Typography>
                  <Button variant="contained" sx={{ mt: 2 }} onClick={() => setDialog(true)}>Add First Slot</Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}

        {/* Create Dialog */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Add Time Slot</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box mt={1} display="flex" flexDirection="column" gap={2}>
              <TextField
                fullWidth label="Start Time *" type="time" size="small"
                value={form.start_time}
                onChange={e => setForm({ ...form, start_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth label="End Time *" type="time" size="small"
                value={form.end_time}
                onChange={e => setForm({ ...form, end_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth label="Label (optional)" size="small"
                placeholder="e.g. 08:00 AM - 08:30 AM"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })}
              />
              {form.start_time && form.end_time && (
                <Alert severity="info" icon={<AccessTime />}>
                  Slot: <strong>{formatTime(form.start_time)} – {formatTime(form.end_time)}</strong>
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={submitting || !form.start_time || !form.end_time}
              onClick={handleCreate}
            >
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Create Slot'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

export default AdminSlots;
