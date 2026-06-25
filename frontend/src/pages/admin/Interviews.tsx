import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Alert,
  TextField, Select, MenuItem, FormControl, InputLabel, CircularProgress,
  Snackbar, Rating, Tooltip
} from '@mui/material';
import { Add, Edit, Feedback, Cancel } from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { statusColors } from '../../utils/theme';
import { MainLayout } from '../../layouts/MainLayout';

const STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'selected', 'rejected', 'cancelled'];
const ROUNDS = ['L1_Technical', 'L2_Technical', 'L3_Technical', 'Manager', 'Assessment', 'HR'];

const AdminInterviews = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');

  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState<any>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [students, setStudents] = useState<any[]>([]);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [cabins, setCabins] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  const [scheduleForm, setScheduleForm] = useState({ student_id: '', technology_id: '', interviewer_id: '', cabin_id: '', time_slot_id: '', interview_date: '', notes: '' });
  const [statusForm, setStatusForm] = useState({ status: '', notes: '', cancellation_reason: '', current_round: '' });
  const [feedbackForm, setFeedbackForm] = useState({ communication_score: 7, technical_score: 7, confidence_score: 7, remarks: '', strengths: '', improvements: '', is_selected: false });

  const load = () => {
    setLoading(true);
    adminApi.listInterviews({ page: 1, size: 30 }).then(r => { setInterviews(r.data.items); setTotal(r.data.total); }).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    Promise.all([adminApi.listStudents({ size: 200 }), adminApi.listTechnologies(), adminApi.listInterviewers(), adminApi.listCabins(), adminApi.listSlots()])
      .then(([st, t, i, c, sl]) => { setStudents(st.data.items); setTechnologies(t.data); setInterviewers(i.data); setCabins(c.data); setSlots(sl.data); });
  }, []);

  const handleSchedule = async () => {
    setError('');
    setSubmitting(true);
    try {
      await adminApi.scheduleInterview(scheduleForm);
      setSnack('Interview scheduled!');
      setScheduleDialog(false);
      load();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to schedule');
    } finally { setSubmitting(false); }
  };

  const handleStatusUpdate = async () => {
    setSubmitting(true);
    try {
      await adminApi.updateInterviewStatus(statusDialog.id, statusForm);
      setSnack('Status updated!');
      setStatusDialog(null);
      load();
    } finally { setSubmitting(false); }
  };

  const handleFeedback = async () => {
    setSubmitting(true);
    try {
      await adminApi.addFeedback(feedbackDialog.id, { ...feedbackForm, interview_id: feedbackDialog.id });
      setSnack('Feedback saved!');
      setFeedbackDialog(null);
    } finally { setSubmitting(false); }
  };

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Interviews</Typography>
            <Typography color="text.secondary">{total} total interviews</Typography>
          </Box>
          <Button variant="contained" startIcon={<Add />} onClick={() => setScheduleDialog(true)}>Schedule Interview</Button>
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Technology</TableCell>
                      <TableCell>Interviewer</TableCell>
                      <TableCell>Cabin</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Round</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {interviews.map((iv: any) => (
                      <TableRow key={iv.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>{iv.student?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{iv.student?.student_id}</Typography>
                        </TableCell>
                        <TableCell>{new Date(iv.interview_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{iv.technology?.name}</TableCell>
                        <TableCell>{iv.interviewer?.name}</TableCell>
                        <TableCell>{iv.cabin?.name}</TableCell>
                        <TableCell>{iv.time_slot?.label || '—'}</TableCell>
                        <TableCell><Chip label={iv.current_round?.replace('_', ' ')} size="small" variant="outlined" /></TableCell>
                        <TableCell>
                          <Chip label={iv.status.replace('_', ' ')} size="small" sx={{ bgcolor: `${statusColors[iv.status]}18`, color: statusColors[iv.status], fontWeight: 600, textTransform: 'capitalize' }} />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Update Status">
                            <IconButton size="small" onClick={() => { setStatusForm({ status: iv.status, notes: iv.notes || '', cancellation_reason: '', current_round: iv.current_round }); setStatusDialog(iv); }}><Edit fontSize="small" /></IconButton>
                          </Tooltip>
                          <Tooltip title="Add Feedback">
                            <IconButton size="small" color="primary" onClick={() => setFeedbackDialog(iv)}><Feedback fontSize="small" /></IconButton>
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

        {/* Schedule Interview Dialog */}
        <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogContent>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Grid container spacing={2} mt={0.5}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Student *</InputLabel>
                  <Select value={scheduleForm.student_id} label="Student *" onChange={e => setScheduleForm({ ...scheduleForm, student_id: e.target.value })}>
                    {students.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.user?.first_name} {s.user?.last_name} — {s.student_id}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Technology *</InputLabel>
                  <Select value={scheduleForm.technology_id} label="Technology *" onChange={e => setScheduleForm({ ...scheduleForm, technology_id: e.target.value })}>
                    {technologies.map((t: any) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Interviewer *</InputLabel>
                  <Select value={scheduleForm.interviewer_id} label="Interviewer *" onChange={e => setScheduleForm({ ...scheduleForm, interviewer_id: e.target.value })}>
                    {interviewers.map((i: any) => <MenuItem key={i.id} value={i.id}>{i.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cabin *</InputLabel>
                  <Select value={scheduleForm.cabin_id} label="Cabin *" onChange={e => setScheduleForm({ ...scheduleForm, cabin_id: e.target.value })}>
                    {cabins.map((c: any) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Time Slot *</InputLabel>
                  <Select value={scheduleForm.time_slot_id} label="Time Slot *" onChange={e => setScheduleForm({ ...scheduleForm, time_slot_id: e.target.value })}>
                    {slots.map((s: any) => <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth type="date" label="Interview Date *" size="small" value={scheduleForm.interview_date} onChange={e => setScheduleForm({ ...scheduleForm, interview_date: e.target.value })} InputLabelProps={{ shrink: true }} inputProps={{ min: new Date().toISOString().split('T')[0] }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" multiline rows={2} size="small" value={scheduleForm.notes} onChange={e => setScheduleForm({ ...scheduleForm, notes: e.target.value })} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialog(false)}>Cancel</Button>
            <Button variant="contained" disabled={submitting || !scheduleForm.student_id || !scheduleForm.interview_date} onClick={handleSchedule}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Schedule'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog open={Boolean(statusDialog)} onClose={() => setStatusDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Update Interview Status</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={0.5}>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={statusForm.status} label="Status" onChange={e => setStatusForm({ ...statusForm, status: e.target.value })}>
                    {STATUSES.map(s => <MenuItem key={s} value={s} sx={{ textTransform: 'capitalize' }}>{s.replace('_', ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Current Round</InputLabel>
                  <Select value={statusForm.current_round} label="Current Round" onChange={e => setStatusForm({ ...statusForm, current_round: e.target.value })}>
                    {ROUNDS.map(r => <MenuItem key={r} value={r}>{r.replace('_', ' ')}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" multiline rows={2} size="small" value={statusForm.notes} onChange={e => setStatusForm({ ...statusForm, notes: e.target.value })} />
              </Grid>
              {statusForm.status === 'cancelled' && (
                <Grid item xs={12}>
                  <TextField fullWidth label="Cancellation Reason" multiline rows={2} size="small" value={statusForm.cancellation_reason} onChange={e => setStatusForm({ ...statusForm, cancellation_reason: e.target.value })} />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(null)}>Cancel</Button>
            <Button variant="contained" disabled={submitting} onClick={handleStatusUpdate}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Update'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog open={Boolean(feedbackDialog)} onClose={() => setFeedbackDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Feedback</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} mt={0.5}>
              {[
                { label: 'Communication Score', field: 'communication_score' },
                { label: 'Technical Score', field: 'technical_score' },
                { label: 'Confidence Score', field: 'confidence_score' },
              ].map(({ label, field }) => (
                <Grid item xs={12} key={field}>
                  <Typography variant="body2" fontWeight={600} mb={0.5}>{label} (1–10)</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Rating
                      max={10} value={(feedbackForm as any)[field]}
                      onChange={(_, v) => setFeedbackForm({ ...feedbackForm, [field]: v || 1 })}
                    />
                    <Chip label={(feedbackForm as any)[field] + '/10'} size="small" color="primary" />
                  </Box>
                </Grid>
              ))}
              <Grid item xs={12}>
                <TextField fullWidth label="Strengths" multiline rows={2} size="small" value={feedbackForm.strengths} onChange={e => setFeedbackForm({ ...feedbackForm, strengths: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Areas for Improvement" multiline rows={2} size="small" value={feedbackForm.improvements} onChange={e => setFeedbackForm({ ...feedbackForm, improvements: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Remarks" multiline rows={2} size="small" value={feedbackForm.remarks} onChange={e => setFeedbackForm({ ...feedbackForm, remarks: e.target.value })} />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <InputLabel>Recommendation</InputLabel>
                  <Select value={String(feedbackForm.is_selected)} label="Recommendation" onChange={e => setFeedbackForm({ ...feedbackForm, is_selected: e.target.value === 'true' })}>
                    <MenuItem value="true">✅ Selected — Proceed to Next Round</MenuItem>
                    <MenuItem value="false">❌ Not Selected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialog(null)}>Cancel</Button>
            <Button variant="contained" disabled={submitting} onClick={handleFeedback}>
              {submitting ? <CircularProgress size={18} color="inherit" /> : 'Save Feedback'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} />
      </Box>
    </MainLayout>
  );
};

export default AdminInterviews;
