import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert,
  InputAdornment, Tooltip, CircularProgress, Snackbar, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Add, Edit, Delete, Search, PersonOff, PersonAdd, Visibility
} from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { statusColors } from '../../utils/theme';
import { MainLayout } from '../../layouts/MainLayout';

const AdminStudents = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');

  const [addDialog, setAddDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    password: '', college: '', degree: '', branch: '', graduation_year: '', skills: ''
  });

  const load = () => {
    setLoading(true);
    adminApi.listStudents({ page, size: 20, search: search || undefined, status: statusFilter || undefined })
      .then(r => { setStudents(r.data.items); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, search, statusFilter]);

  const handleAdd = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      await adminApi.createStudent({
        ...form,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
        skills: form.skills ? form.skills.split(',').map(s => s.trim()) : [],
        password: form.password || 'Student@123',
      });
      setSnack('Student added successfully!');
      setAddDialog(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: '', college: '', degree: '', branch: '', graduation_year: '', skills: '' });
      load();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to add student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string, current: string) => {
    try {
      await adminApi.updateStudentStatus(id, current === 'active' ? 'inactive' : 'active');
      setSnack('Student status updated!');
      load();
    } catch { setSnack('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    try {
      await adminApi.deleteStudent(deleteDialog);
      setSnack('Student deleted.');
      setDeleteDialog(null);
      load();
    } catch { setSnack('Failed to delete student'); }
  };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Students</Typography>
            <Typography color="text.secondary">{total} total students registered</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialog(true)}>Add Student</Button>
        </Box>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
              <TextField
                placeholder="Search by name, email, ID..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                size="small"
                sx={{ flex: 1, minWidth: 250 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            ) : students.length === 0 ? (
              <Box textAlign="center" py={5}>
                <Typography color="text.secondary">No students found</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student ID</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>College</TableCell>
                      <TableCell>Branch</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((s: any) => (
                      <TableRow key={s.id} hover>
                        <TableCell><Chip label={s.student_id || '—'} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{s.user?.first_name} {s.user?.last_name}</Typography>
                        </TableCell>
                        <TableCell>{s.user?.email}</TableCell>
                        <TableCell>{s.user?.phone || '—'}</TableCell>
                        <TableCell>{s.college || '—'}</TableCell>
                        <TableCell>{s.branch || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={s.user?.status}
                            size="small"
                            sx={{ bgcolor: `${statusColors[s.user?.status]}18`, color: statusColors[s.user?.status], fontWeight: 600, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setViewDialog(s)}><Visibility fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title={s.user?.status === 'active' ? 'Deactivate' : 'Activate'}>
                            <IconButton size="small" color={s.user?.status === 'active' ? 'warning' : 'success'} onClick={() => handleToggleStatus(s.id, s.user?.status)}>
                              {s.user?.status === 'active' ? <PersonOff fontSize="small" /> : <PersonAdd fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" color="error" onClick={() => setDeleteDialog(s.id)}><Delete fontSize="small" /></IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Add Student Dialog */}
        <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogContent>
            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
            <Grid container spacing={2} mt={0.5}>
              {[
                { label: 'First Name *', field: 'first_name', md: 6 },
                { label: 'Last Name *', field: 'last_name', md: 6 },
                { label: 'Email *', field: 'email', type: 'email', md: 12 },
                { label: 'Phone', field: 'phone', md: 6 },
                { label: 'Password (default: Student@123)', field: 'password', md: 6 },
                { label: 'College', field: 'college', md: 12 },
                { label: 'Degree', field: 'degree', md: 6 },
                { label: 'Branch', field: 'branch', md: 6 },
                { label: 'Graduation Year', field: 'graduation_year', type: 'number', md: 6 },
                { label: 'Skills (comma-separated)', field: 'skills', md: 6 },
              ].map(({ label, field, type, md }) => (
                <Grid item xs={12} md={md as any} key={field}>
                  <TextField
                    fullWidth label={label} type={type || 'text'} size="small"
                    value={(form as any)[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                  />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleAdd} disabled={submitting || !form.first_name || !form.email}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Add Student'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* View Student Dialog */}
        <Dialog open={Boolean(viewDialog)} onClose={() => setViewDialog(null)} maxWidth="sm" fullWidth>
          {viewDialog && (
            <>
              <DialogTitle>Student Details — {viewDialog.student_id}</DialogTitle>
              <DialogContent>
                <Grid container spacing={2}>
                  {[
                    ['Name', `${viewDialog.user?.first_name} ${viewDialog.user?.last_name}`],
                    ['Email', viewDialog.user?.email],
                    ['Phone', viewDialog.user?.phone],
                    ['College', viewDialog.college],
                    ['Degree', viewDialog.degree],
                    ['Branch', viewDialog.branch],
                    ['Graduation Year', viewDialog.graduation_year],
                    ['CGPA', viewDialog.cgpa],
                    ['City', viewDialog.city],
                    ['Status', viewDialog.user?.status],
                  ].map(([label, value]) => (
                    <Grid item xs={6} key={label as string}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
                    </Grid>
                  ))}
                  {viewDialog.skills?.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Skills</Typography>
                      <Box mt={0.5} display="flex" flexWrap="wrap" gap={0.5}>
                        {viewDialog.skills.map((s: string) => <Chip key={s} label={s} size="small" variant="outlined" />)}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setViewDialog(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Student</DialogTitle>
          <DialogContent>
            <Alert severity="error">This action is permanent and cannot be undone. All associated interview data will also be deleted.</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

export default AdminStudents;
