import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Snackbar, Select, MenuItem, FormControl,
  InputLabel, Grid
} from '@mui/material';
import { Add, Delete, Announcement as AnnouncementIcon } from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const AdminAnnouncements = () => {
  const [data, setData] = useState<any[]>([]);
  const [dialog, setDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', content: '', priority: 'normal', target_role: '', expires_at: ''
  });

  const load = () => {
    setLoading(true);
    adminApi.listAnnouncements().then(r => setData(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handlePost = async () => {
    setError('');
    setSubmitting(true);
    try {
      await adminApi.createAnnouncement({
        ...form,
        target_role: form.target_role || undefined,
        expires_at: form.expires_at || undefined,
      });
      setSnack('Announcement posted!');
      setDialog(false);
      setForm({ title: '', content: '', priority: 'normal', target_role: '', expires_at: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to post');
    } finally { setSubmitting(false); }
  };

  const priorityColor = (p: string) => p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'default';

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Announcements</Typography>
            <Typography color="text.secondary">Post announcements visible to students and admins</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setDialog(true)}>Post Announcement</Button>
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            ) : data.length === 0 ? (
              <Box textAlign="center" py={6}>
                <AnnouncementIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">No announcements yet</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Content</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Posted On</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((a: any) => (
                      <TableRow key={a.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{a.title}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{
                            maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {a.content}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={a.priority} size="small" color={priorityColor(a.priority) as any} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={a.status}
                            size="small"
                            color={a.status === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell>{new Date(a.created_at).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" color="error">
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Post Dialog */}
        <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Post New Announcement</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Title *" size="small"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Content *" multiline rows={4} size="small"
                  value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={form.priority} label="Priority" onChange={e => setForm({ ...form, priority: e.target.value })}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Target Role</InputLabel>
                  <Select value={form.target_role} label="Target Role" onChange={e => setForm({ ...form, target_role: e.target.value })}>
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="student">Students Only</MenuItem>
                    <MenuItem value="admin">Admins Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth label="Expires At (optional)" type="datetime-local" size="small"
                  value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              disabled={submitting || !form.title || !form.content}
              onClick={handlePost}
            >
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Post Announcement'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

export default AdminAnnouncements;
