import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Button, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  CircularProgress, Grid, Stepper, Step, StepLabel, StepContent, Alert
} from '@mui/material';
import { Cancel, Visibility, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { studentApi, interviewApi } from '../../services/api';
import { statusColors } from '../../utils/theme';
import { MainLayout } from '../../layouts/MainLayout';

const ROUNDS = ['L1_Technical', 'L2_Technical', 'L3_Technical', 'Manager', 'Assessment', 'HR'];
const ROUND_LABELS: Record<string, string> = {
  L1_Technical: 'L1 Technical', L2_Technical: 'L2 Technical', L3_Technical: 'L3 Technical',
  Manager: 'Manager Round', Assessment: 'Assessment Round', HR: 'HR Round',
};

const MyInterviews = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [cancelDialog, setCancelDialog] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const statusFilters = ['all', 'scheduled', 'pending', 'in_progress', 'completed', 'selected', 'rejected', 'cancelled'];

  const load = () => {
    setLoading(true);
    studentApi.getMyInterviews().then(r => setInterviews(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = tab === 0 ? interviews : interviews.filter(i => i.status === statusFilters[tab]);

  const handleCancel = async () => {
    if (!cancelDialog) return;
    setCancelling(true);
    try {
      await interviewApi.cancel(cancelDialog, cancelReason);
      setCancelDialog(null);
      setCancelReason('');
      load();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const getRoundIndex = (current: string) => ROUNDS.indexOf(current);

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={0.5}>My Interviews</Typography>
        <Typography color="text.secondary" mb={3}>Track your interview progress and history</Typography>

        <Card>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: '1px solid #E0E0E0', px: 2 }}
          >
            {statusFilters.map((s, i) => (
              <Tab
                key={s}
                label={
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <span style={{ textTransform: 'capitalize' }}>{s === 'all' ? 'All' : s.replace('_', ' ')}</span>
                    <Chip label={s === 'all' ? interviews.length : interviews.filter(iv => iv.status === s).length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                  </Box>
                }
              />
            ))}
          </Tabs>

          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : filtered.length === 0 ? (
              <Box textAlign="center" py={6}>
                <Typography variant="h2">📅</Typography>
                <Typography color="text.secondary" mt={1}>No interviews found</Typography>
                <Button variant="contained" href="/student/book" sx={{ mt: 2 }}>Book Interview</Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Technology</TableCell>
                      <TableCell>Interviewer</TableCell>
                      <TableCell>Cabin</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Current Round</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.map(iv => (
                      <TableRow key={iv.id} hover>
                        <TableCell>{new Date(iv.interview_date).toLocaleDateString('en-IN')}</TableCell>
                        <TableCell>{iv.technology?.name || '—'}</TableCell>
                        <TableCell>{iv.interviewer?.name || '—'}</TableCell>
                        <TableCell>{iv.cabin?.name || '—'}</TableCell>
                        <TableCell>{iv.time_slot?.label || '—'}</TableCell>
                        <TableCell>
                          <Chip label={ROUND_LABELS[iv.current_round] || iv.current_round} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={iv.status.replace('_', ' ')}
                            size="small"
                            sx={{ bgcolor: `${statusColors[iv.status]}18`, color: statusColors[iv.status], fontWeight: 600, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" startIcon={<Visibility />} onClick={() => setSelected(iv)} sx={{ mr: 0.5 }}>
                            View
                          </Button>
                          {['pending', 'scheduled'].includes(iv.status) && (
                            <Button size="small" color="error" startIcon={<Cancel />} onClick={() => setCancelDialog(iv.id)}>
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Interview Detail Dialog */}
        <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          {selected && (
            <>
              <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6" fontWeight={700}>Interview Details</Typography>
                  <Chip
                    label={selected.status.replace('_', ' ')}
                    size="small"
                    sx={{ bgcolor: `${statusColors[selected.status]}18`, color: statusColors[selected.status], fontWeight: 600, textTransform: 'capitalize' }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={2} mb={3}>
                  {[
                    { label: 'Date', value: new Date(selected.interview_date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                    { label: 'Technology', value: selected.technology?.name },
                    { label: 'Interviewer', value: selected.interviewer?.name },
                    { label: 'Cabin', value: selected.cabin?.name },
                    { label: 'Time Slot', value: selected.time_slot?.label },
                    { label: 'Booked On', value: new Date(selected.created_at).toLocaleDateString('en-IN') },
                  ].map(({ label, value }) => (
                    <Grid item xs={6} key={label}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
                    </Grid>
                  ))}
                </Grid>

                {/* Round Progress */}
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Interview Progress</Typography>
                <Stepper activeStep={getRoundIndex(selected.current_round)} orientation="vertical" sx={{ mb: 2 }}>
                  {ROUNDS.map((round, idx) => {
                    const currentIdx = getRoundIndex(selected.current_round);
                    const done = idx < currentIdx || selected.status === 'completed' || selected.status === 'selected';
                    const active = idx === currentIdx;
                    return (
                      <Step key={round} completed={done}>
                        <StepLabel
                          StepIconComponent={() => (
                            done ? <CheckCircle sx={{ color: 'success.main', fontSize: 22 }} /> :
                              active ? <RadioButtonUnchecked sx={{ color: 'primary.main', fontSize: 22 }} /> :
                                <RadioButtonUnchecked sx={{ color: 'text.disabled', fontSize: 22 }} />
                          )}
                        >
                          <Typography variant="body2" fontWeight={active ? 700 : 400} color={active ? 'primary' : 'text.secondary'}>
                            {ROUND_LABELS[round]}
                            {active && <Chip label="Current" size="small" color="primary" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                          </Typography>
                        </StepLabel>
                        <StepContent><Box /></StepContent>
                      </Step>
                    );
                  })}
                </Stepper>

                {/* Feedback */}
                {selected.feedbacks?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>Feedback</Typography>
                    {selected.feedbacks.map((f: any, i: number) => (
                      <Box key={i} sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mb: 1 }}>
                        <Grid container spacing={1}>
                          {[
                            { label: 'Communication', value: f.communication_score },
                            { label: 'Technical', value: f.technical_score },
                            { label: 'Confidence', value: f.confidence_score },
                            { label: 'Overall', value: f.overall_score },
                          ].map(({ label, value }) => (
                            <Grid item xs={3} key={label}>
                              <Typography variant="caption" color="text.secondary">{label}</Typography>
                              <Typography variant="h6" fontWeight={700} color="primary">{value ?? '—'}/10</Typography>
                            </Grid>
                          ))}
                        </Grid>
                        {f.remarks && <Typography variant="body2" color="text.secondary" mt={1}><b>Remarks:</b> {f.remarks}</Typography>}
                      </Box>
                    ))}
                  </>
                )}

                {selected.status === 'selected' && (
                  <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
                    🎉 Congratulations! You have been selected!
                  </Alert>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelected(null)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Cancel Dialog */}
        <Dialog open={Boolean(cancelDialog)} onClose={() => setCancelDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Cancel Interview</DialogTitle>
          <DialogContent>
            <Typography color="text.secondary" mb={2}>Are you sure you want to cancel this interview?</Typography>
            <TextField
              fullWidth multiline rows={3}
              label="Reason (optional)"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCancelDialog(null)}>Keep Interview</Button>
            <Button color="error" variant="contained" disabled={cancelling} onClick={handleCancel}>
              {cancelling ? <CircularProgress size={18} color="inherit" /> : 'Cancel Interview'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
};

export default MyInterviews;
