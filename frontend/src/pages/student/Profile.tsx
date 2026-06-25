import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Alert, CircularProgress, Chip, Divider, Avatar, IconButton,
  Autocomplete, InputAdornment, Snackbar
} from '@mui/material';
import { Edit, Save, Cancel, Upload, Link as LinkIcon, School, Work } from '@mui/icons-material';
import { studentApi, authApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MainLayout } from '../../layouts/MainLayout';

const SKILLS_OPTIONS = ['Python', 'Java', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'SQL', 'MongoDB', 'Selenium', 'Playwright', 'DevOps', 'Data Engineering', 'Machine Learning'];

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snack, setSnack] = useState('');
  const [loading, setLoading] = useState(true);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const load = () => {
    studentApi.getProfile().then(r => {
      setProfile(r.data);
      setForm(r.data.student || {});
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await studentApi.updateProfile(form);
      setSnack('Profile updated successfully!');
      setEditing(false);
      load();
    } catch {
      setSnack('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await studentApi.uploadResume(file);
      setSnack('Resume uploaded successfully!');
      load();
    } catch (err: any) {
      setSnack(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePw = async () => {
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    if (pwForm.new_password.length < 8) { setPwError('Password must be at least 8 characters'); return; }
    setPwLoading(true);
    try {
      await authApi.changePassword(pwForm.current_password, pwForm.new_password);
      setSnack('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      setPwError(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <MainLayout><Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box></MainLayout>;

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={0.5}>My Profile</Typography>
        <Typography color="text.secondary" mb={3}>Manage your personal and academic information</Typography>

        <Grid container spacing={3}>
          {/* Left: Avatar + Quick Info */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ width: 90, height: 90, bgcolor: 'primary.main', fontSize: '2rem', mx: 'auto', mb: 2 }}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{user?.first_name} {user?.last_name}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>{user?.email}</Typography>
                <Chip label={profile?.student?.student_id || 'Student'} size="small" color="primary" />

                <Divider sx={{ my: 2 }} />

                {/* Resume */}
                <Box textAlign="left">
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Resume</Typography>
                  {profile?.student?.resume_filename ? (
                    <Box sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200', borderRadius: 1.5, p: 1.5, mb: 1 }}>
                      <Typography variant="body2" color="success.dark" noWrap>📄 {profile.student.resume_filename}</Typography>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" mb={1}>No resume uploaded</Typography>
                  )}
                  <Button
                    variant="outlined" fullWidth component="label" size="small"
                    startIcon={uploading ? <CircularProgress size={14} /> : <Upload />}
                    disabled={uploading}
                  >
                    {profile?.student?.resume_filename ? 'Replace Resume' : 'Upload Resume'}
                    <input type="file" hidden accept=".pdf,.doc,.docx" onChange={handleResumeUpload} />
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>PDF, DOC, DOCX up to 5MB</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Change Password</Typography>
                {pwError && <Alert severity="error" sx={{ mb: 1 }}>{pwError}</Alert>}
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <TextField label="Current Password" type="password" fullWidth size="small" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} />
                  <TextField label="New Password" type="password" fullWidth size="small" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} />
                  <TextField label="Confirm Password" type="password" fullWidth size="small" value={pwForm.confirm} onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })} />
                  <Button variant="contained" fullWidth disabled={pwLoading} onClick={handleChangePw}>
                    {pwLoading ? <CircularProgress size={18} color="inherit" /> : 'Update Password'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Profile Form */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <School color="primary" />
                    <Typography variant="h6" fontWeight={700}>Academic & Personal Info</Typography>
                  </Box>
                  {!editing ? (
                    <Button startIcon={<Edit />} variant="outlined" size="small" onClick={() => setEditing(true)}>Edit</Button>
                  ) : (
                    <Box display="flex" gap={1}>
                      <Button startIcon={<Cancel />} variant="outlined" size="small" color="inherit" onClick={() => { setEditing(false); setForm(profile?.student); }}>Cancel</Button>
                      <Button startIcon={<Save />} variant="contained" size="small" onClick={handleSave} disabled={saving}>
                        {saving ? <CircularProgress size={16} color="inherit" /> : 'Save'}
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={2}>
                  {[
                    { label: 'College/University', field: 'college', md: 12 },
                    { label: 'Degree', field: 'degree', md: 4 },
                    { label: 'Branch/Specialization', field: 'branch', md: 4 },
                    { label: 'Graduation Year', field: 'graduation_year', type: 'number', md: 4 },
                    { label: 'CGPA/Percentage', field: 'cgpa', type: 'number', md: 4 },
                    { label: 'Gender', field: 'gender', md: 4 },
                    { label: 'City', field: 'city', md: 4 },
                    { label: 'State', field: 'state', md: 4 },
                    { label: 'Pincode', field: 'pincode', md: 4 },
                  ].map(({ label, field, type, md }) => (
                    <Grid item xs={12} md={md as any} key={field}>
                      <TextField
                        fullWidth label={label} type={type || 'text'}
                        value={form[field] || ''}
                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                        disabled={!editing}
                        size="small"
                      />
                    </Grid>
                  ))}

                  <Grid item xs={12}>
                    <Autocomplete
                      multiple freeSolo
                      options={SKILLS_OPTIONS}
                      value={form.skills || []}
                      onChange={(_, v) => setForm({ ...form, skills: v })}
                      disabled={!editing}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} />)
                      }
                      renderInput={(params) => <TextField {...params} label="Skills" placeholder="Add skills..." size="small" />}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Work color="primary" />
                  <Typography variant="subtitle1" fontWeight={700}>Work Experience</Typography>
                </Box>

                <Grid container spacing={2}>
                  {[
                    { label: 'Current Company', field: 'current_company', md: 6 },
                    { label: 'Current Role', field: 'job_role', md: 6 },
                    { label: 'Experience (months)', field: 'experience_months', type: 'number', md: 4 },
                    { label: 'Expected CTC (₹)', field: 'expected_ctc', type: 'number', md: 4 },
                    { label: 'Notice Period (days)', field: 'notice_period_days', type: 'number', md: 4 },
                  ].map(({ label, field, type, md }) => (
                    <Grid item xs={12} md={md as any} key={field}>
                      <TextField
                        fullWidth label={label} type={type || 'text'}
                        value={form[field] || ''}
                        onChange={e => setForm({ ...form, [field]: e.target.value })}
                        disabled={!editing}
                        size="small"
                      />
                    </Grid>
                  ))}

                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="LinkedIn URL" value={form.linkedin_url || ''} onChange={e => setForm({ ...form, linkedin_url: e.target.value })} disabled={!editing} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" /></InputAdornment> }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField fullWidth label="GitHub URL" value={form.github_url || ''} onChange={e => setForm({ ...form, github_url: e.target.value })} disabled={!editing} size="small" InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon fontSize="small" /></InputAdornment> }} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

export default StudentProfile;
