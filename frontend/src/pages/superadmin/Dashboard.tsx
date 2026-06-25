import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Alert, CircularProgress, Snackbar, Tabs, Tab, Avatar
} from '@mui/material';
import { Add, Delete, AdminPanelSettings, Settings, Article } from '@mui/icons-material';
import { superAdminApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const SuperAdminDashboard = () => {
  const [tab, setTab] = useState(0);
  const [admins, setAdmins] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');
  const [addDialog, setAddDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', password: 'Admin@123' });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      superAdminApi.listAdmins(),
      superAdminApi.getAuditLogs(),
      superAdminApi.getSettings(),
    ]).then(([a, l, s]) => {
      setAdmins(a.data);
      setLogs(l.data);
      setSettings(s.data);
    }).finally(() => setLoading(false));
  }, []);

  const loadAdmins = () => superAdminApi.listAdmins().then(r => setAdmins(r.data));

  const handleAddAdmin = async () => {
    setError('');
    setSubmitting(true);
    try {
      await superAdminApi.addAdmin(form);
      setSnack('Admin added successfully!');
      setAddDialog(false);
      setForm({ first_name: '', last_name: '', email: '', phone: '', password: 'Admin@123' });
      loadAdmins();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add admin');
    } finally { setSubmitting(false); }
  };

  const handleRemoveAdmin = async () => {
    if (!deleteDialog) return;
    try {
      await superAdminApi.removeAdmin(deleteDialog);
      setSnack('Admin removed.');
      setDeleteDialog(null);
      loadAdmins();
    } catch { setSnack('Failed to remove admin'); }
  };

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Super Admin Panel</Typography>
        <Typography color="text.secondary" mb={3}>Manage system-wide settings and administrators</Typography>

        <Card>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E0E0E0', px: 2 }}>
            <Tab icon={<AdminPanelSettings />} iconPosition="start" label="Admins" />
            <Tab icon={<Settings />} iconPosition="start" label="System Settings" />
            <Tab icon={<Article />} iconPosition="start" label="Audit Logs" />
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            ) : (
              <>
                {/* Admins Tab */}
                {tab === 0 && (
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" fontWeight={700}>{admins.length} Administrator(s)</Typography>
                      <Button variant="contained" startIcon={<Add />} onClick={() => setAddDialog(true)}>Add Admin</Button>
                    </Box>

                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {admins.map((a: any) => (
                            <TableRow key={a.id} hover>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                    {a.first_name?.[0]}{a.last_name?.[0]}
                                  </Avatar>
                                  <Typography variant="body2" fontWeight={600}>{a.first_name} {a.last_name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{a.email}</TableCell>
                              <TableCell>{a.phone || '—'}</TableCell>
                              <TableCell>
                                <Chip label={a.status} size="small" color={a.status === 'active' ? 'success' : 'default'} />
                              </TableCell>
                              <TableCell>{new Date(a.created_at).toLocaleDateString('en-IN')}</TableCell>
                              <TableCell align="right">
                                <IconButton size="small" color="error" onClick={() => setDeleteDialog(a.id)}>
                                  <Delete fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Settings Tab */}
                {tab === 1 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>System Settings</Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Setting Key</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell align="right">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {settings.map((s: any) => (
                            <SettingRow key={s.id} setting={s} onSave={(key, val) => superAdminApi.updateSetting(key, val).then(() => setSnack('Setting updated!'))} />
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Audit Logs Tab */}
                {tab === 2 && (
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>Audit Logs (last 500)</Typography>
                    <TableContainer sx={{ maxHeight: 500 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>IP</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {logs.map((l: any) => (
                            <TableRow key={l.id} hover>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                <Typography variant="caption">{new Date(l.created_at).toLocaleString('en-IN')}</Typography>
                              </TableCell>
                              <TableCell>
                                <Chip label={l.action} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell>{l.description}</TableCell>
                              <TableCell><Typography variant="caption">{l.ip_address || '—'}</Typography></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Admin Dialog */}
        <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Add New Admin</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Box mt={1} display="flex" flexDirection="column" gap={2}>
              {[
                { label: 'First Name *', field: 'first_name' },
                { label: 'Last Name *', field: 'last_name' },
                { label: 'Email *', field: 'email', type: 'email' },
                { label: 'Phone', field: 'phone' },
                { label: 'Password', field: 'password', type: 'password' },
              ].map(({ label, field, type }) => (
                <TextField key={field} fullWidth label={label} type={type || 'text'} size="small"
                  value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddDialog(false)}>Cancel</Button>
            <Button variant="contained" disabled={submitting || !form.first_name || !form.email} onClick={handleAddAdmin}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Add Admin'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Remove Admin</DialogTitle>
          <DialogContent>
            <Alert severity="warning">Are you sure you want to remove this admin? They will lose access to the portal.</Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
            <Button color="error" variant="contained" onClick={handleRemoveAdmin}>Remove</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

// Inline editable setting row
const SettingRow = ({ setting, onSave }: { setting: any; onSave: (key: string, val: string) => void }) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(setting.value || '');
  return (
    <TableRow hover>
      <TableCell><Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>{setting.key}</Typography></TableCell>
      <TableCell>
        {editing ? (
          <TextField size="small" value={val} onChange={e => setVal(e.target.value)} sx={{ width: 150 }} />
        ) : (
          <Typography variant="body2">{setting.value}</Typography>
        )}
      </TableCell>
      <TableCell><Typography variant="caption" color="text.secondary">{setting.description}</Typography></TableCell>
      <TableCell align="right">
        {editing ? (
          <Box display="flex" gap={0.5}>
            <Button size="small" variant="contained" onClick={() => { onSave(setting.key, val); setEditing(false); }}>Save</Button>
            <Button size="small" onClick={() => { setEditing(false); setVal(setting.value); }}>Cancel</Button>
          </Box>
        ) : (
          <Button size="small" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </TableCell>
    </TableRow>
  );
};

export default SuperAdminDashboard;
