import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert,
  Tooltip, CircularProgress, Snackbar, Switch, FormControlLabel
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

// ---- Generic CRUD Table ----
const CrudTable = ({ columns, rows, onEdit, onDelete, onToggle, toggleField }: any) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>{columns.map((c: string) => <TableCell key={c}>{c}</TableCell>)}<TableCell align="right">Actions</TableCell></TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row: any) => (
          <TableRow key={row.id} hover>
            {columns.map((c: string, i: number) => (
              <TableCell key={i}>
                {row._cells?.[i] ?? String(row[c.toLowerCase().replace(/ /g, '_')] ?? '—')}
              </TableCell>
            ))}
            <TableCell align="right">
              {onToggle && (
                <Tooltip title={row[toggleField] ? 'Disable' : 'Enable'}>
                  <Switch checked={Boolean(row[toggleField])} size="small" onChange={() => onToggle(row)} />
                </Tooltip>
              )}
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(row)}><Edit fontSize="small" /></IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(row.id)}><Delete fontSize="small" /></IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ======================== TECHNOLOGIES ========================
export const AdminTechnologies = () => {
  const [data, setData] = useState<any[]>([]);
  const [dialog, setDialog] = useState<any>(null); // null=closed, {}=add, {id,...}=edit
  const [form, setForm] = useState({ name: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');

  const load = () => adminApi.listTechnologies().then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (dialog?.id) await adminApi.updateTechnology(dialog.id, form);
      else await adminApi.createTechnology(form);
      setSnack(dialog?.id ? 'Updated!' : 'Technology added!');
      setDialog(null);
      setForm({ name: '', description: '' });
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error');
    } finally { setSubmitting(false); }
  };

  const openEdit = (row: any) => { setForm({ name: row.name, description: row.description || '' }); setDialog(row); };
  const openAdd = () => { setForm({ name: '', description: '' }); setDialog({}); };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Technologies</Typography>
            <Typography color="text.secondary">Manage available technology stacks</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Technology</Button>
        </Box>

        <Card>
          <CardContent sx={{ p: 2 }}>
            {data.length === 0 ? (
              <Box textAlign="center" py={4}><Typography color="text.secondary">No technologies yet</Typography></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.map((t: any) => (
                      <TableRow key={t.id} hover>
                        <TableCell><Typography fontWeight={600}>{t.name}</Typography></TableCell>
                        <TableCell>{t.description || '—'}</TableCell>
                        <TableCell>
                          <Chip label={t.is_active ? 'Active' : 'Inactive'} size="small" color={t.is_active ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => openEdit(t)}><Edit fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => adminApi.deleteTechnology(t.id).then(load)}><Delete fontSize="small" /></IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{dialog?.id ? 'Edit Technology' : 'Add Technology'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            <Box mt={1} display="flex" flexDirection="column" gap={2}>
              <TextField fullWidth label="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <TextField fullWidth label="Description" multiline rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="contained" disabled={submitting || !form.name} onClick={handleSave}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : (dialog?.id ? 'Save' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

// ======================== INTERVIEWERS ========================
export const AdminInterviewers = () => {
  const [data, setData] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [dialog, setDialog] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', technology_id: '', experience_years: '', designation: '', company: '' });

  const load = () => Promise.all([adminApi.listInterviewers(), adminApi.listTechnologies()]).then(([i, t]) => { setData(i.data); setTechnologies(t.data); });
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form, experience_years: form.experience_years ? parseInt(form.experience_years) : undefined };
      if (dialog?.id) await adminApi.updateInterviewer(dialog.id, payload);
      else await adminApi.createInterviewer(payload);
      setSnack(dialog?.id ? 'Updated!' : 'Interviewer added!');
      setDialog(null);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error');
    } finally { setSubmitting(false); }
  };

  const openEdit = (row: any) => {
    setForm({ name: row.name, email: row.email, phone: row.phone || '', technology_id: row.technology?.id || '', experience_years: String(row.experience_years || ''), designation: row.designation || '', company: row.company || '' });
    setDialog(row);
  };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Interviewers</Typography>
            <Typography color="text.secondary">Manage interviewers and support persons</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ name: '', email: '', phone: '', technology_id: '', experience_years: '', designation: '', company: '' }); setDialog({}); }}>Add Interviewer</Button>
        </Box>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Technology</TableCell>
                    <TableCell>Experience</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((iv: any) => (
                    <TableRow key={iv.id} hover>
                      <TableCell><Typography fontWeight={600}>{iv.name}</Typography><Typography variant="caption" color="text.secondary">{iv.designation}</Typography></TableCell>
                      <TableCell>{iv.email}</TableCell>
                      <TableCell>{iv.phone || '—'}</TableCell>
                      <TableCell><Chip label={iv.technology?.name || '—'} size="small" variant="outlined" /></TableCell>
                      <TableCell>{iv.experience_years ? `${iv.experience_years} yrs` : '—'}</TableCell>
                      <TableCell>{iv.company || '—'}</TableCell>
                      <TableCell><Chip label={iv.status} size="small" color={iv.status === 'active' ? 'success' : 'default'} /></TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => openEdit(iv)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => adminApi.deleteInterviewer(iv.id).then(load)}><Delete fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{dialog?.id ? 'Edit Interviewer' : 'Add Interviewer'}</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0.5}>
              {[
                { label: 'Name *', field: 'name', md: 6 }, { label: 'Email *', field: 'email', md: 6 },
                { label: 'Phone', field: 'phone', md: 6 }, { label: 'Designation', field: 'designation', md: 6 },
                { label: 'Company', field: 'company', md: 6 }, { label: 'Experience (years)', field: 'experience_years', type: 'number', md: 6 },
              ].map(({ label, field, type, md }) => (
                <Grid item xs={12} md={md as any} key={field}>
                  <TextField fullWidth label={label} type={type || 'text'} size="small" value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField
                  fullWidth select label="Technology" size="small"
                  value={form.technology_id}
                  onChange={e => setForm({ ...form, technology_id: e.target.value })}
                  SelectProps={{ native: false }}
                >
                  {technologies.map(t => (
                    <Box key={t.id} component="option" value={t.id} sx={{ display: 'none' }} />
                  ))}
                  {technologies.map((t: any) => (
                    <Box key={t.id} component="li" sx={{ display: 'flex', p: 1, cursor: 'pointer' }} onClick={() => setForm({ ...form, technology_id: t.id })}>
                      {t.name}
                    </Box>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="contained" disabled={submitting || !form.name || !form.email} onClick={handleSave}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : (dialog?.id ? 'Save' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

// ======================== CABINS ========================
export const AdminCabins = () => {
  const [data, setData] = useState<any[]>([]);
  const [dialog, setDialog] = useState<any>(null);
  const [form, setForm] = useState({ name: '', location: '', capacity: '2', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState('');

  const load = () => adminApi.listCabins().then(r => setData(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const payload = { ...form, capacity: parseInt(form.capacity) };
      if (dialog?.id) await adminApi.updateCabin(dialog.id, payload);
      else await adminApi.createCabin(payload);
      setSnack(dialog?.id ? 'Updated!' : 'Cabin added!');
      setDialog(null);
      load();
    } finally { setSubmitting(false); }
  };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Cabin Management</Typography>
            <Typography color="text.secondary">Manage interview rooms and cabins</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => { setForm({ name: '', location: '', capacity: '2', description: '' }); setDialog({}); }}>Add Cabin</Button>
        </Box>

        <Grid container spacing={3}>
          {data.map((cabin: any) => (
            <Grid item xs={12} sm={6} md={4} key={cabin.id}>
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{cabin.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{cabin.location}</Typography>
                    </Box>
                    <Chip label={cabin.status} size="small" color={cabin.status === 'active' ? 'success' : 'default'} />
                  </Box>
                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">Capacity: <b>{cabin.capacity}</b></Typography>
                    <Box>
                      <IconButton size="small" onClick={() => { setForm({ name: cabin.name, location: cabin.location || '', capacity: String(cabin.capacity), description: cabin.description || '' }); setDialog(cabin); }}>
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="warning" onClick={() => adminApi.updateCabin(cabin.id, { status: cabin.status === 'active' ? 'inactive' : 'active' }).then(load)}>
                        {cabin.status === 'active' ? '🔒' : '🔓'}
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>{dialog?.id ? 'Edit Cabin' : 'Add Cabin'}</DialogTitle>
          <DialogContent>
            <Box mt={1} display="flex" flexDirection="column" gap={2}>
              <TextField fullWidth label="Cabin Name *" size="small" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <TextField fullWidth label="Location" size="small" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              <TextField fullWidth label="Capacity" type="number" size="small" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              <TextField fullWidth label="Description" multiline rows={2} size="small" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="contained" disabled={submitting || !form.name} onClick={handleSave}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : (dialog?.id ? 'Save' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};
