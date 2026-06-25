import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Stepper, Step, StepLabel,
  FormControl, InputLabel, Select, MenuItem, Alert, CircularProgress, Chip,
  Divider, Paper, TextField
} from '@mui/material';
import { CheckCircle, Schedule } from '@mui/icons-material';
import { adminApi, interviewApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const steps = ['Select Technology & Interviewer', 'Choose Cabin & Slot', 'Confirm Booking'];

const BookInterview = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [technologies, setTechnologies] = useState<any[]>([]);
  const [interviewers, setInterviewers] = useState<any[]>([]);
  const [cabins, setCabins] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    technology_id: '', interviewer_id: '', cabin_id: '',
    time_slot_id: '', interview_date: ''
  });

  useEffect(() => {
    Promise.all([adminApi.listTechnologies(), adminApi.listInterviewers(), adminApi.listCabins()])
      .then(([t, i, c]) => {
        setTechnologies(t.data.filter((x: any) => x.is_active));
        setInterviewers(i.data.filter((x: any) => x.status === 'active'));
        setCabins(c.data.filter((x: any) => x.status === 'active'));
      });
  }, []);

  useEffect(() => {
    if (form.interview_date) {
      setLoading(true);
      adminApi.getAvailableSlots({ interview_date: form.interview_date, cabin_id: form.cabin_id || undefined })
        .then(res => setAvailableSlots(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [form.interview_date, form.cabin_id]);

  const filteredInterviewers = form.technology_id
    ? interviewers.filter(i => i.technology?.id === form.technology_id)
    : interviewers;

  const handleBook = async () => {
    setError('');
    setSubmitting(true);
    try {
      await interviewApi.book(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const canNext = () => {
    if (activeStep === 0) return form.technology_id && form.interviewer_id;
    if (activeStep === 1) return form.cabin_id && form.time_slot_id && form.interview_date;
    return true;
  };

  const selectedTech = technologies.find(t => t.id === form.technology_id);
  const selectedInterviewer = interviewers.find(i => i.id === form.interviewer_id);
  const selectedCabin = cabins.find(c => c.id === form.cabin_id);
  const selectedSlot = availableSlots.flatMap(c => c.slots).find((s: any) => s.slot_id === form.time_slot_id);

  if (success) return (
    <MainLayout>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <CardContent sx={{ p: 5 }}>
            <CheckCircle sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" fontWeight={700} mb={1}>Interview Booked!</Typography>
            <Typography color="text.secondary" mb={3}>
              Your interview has been successfully scheduled for <strong>{form.interview_date}</strong>.
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2, mb: 3, textAlign: 'left' }}>
              <Grid container spacing={1}>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Technology</Typography><Typography variant="body2" fontWeight={600}>{selectedTech?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Interviewer</Typography><Typography variant="body2" fontWeight={600}>{selectedInterviewer?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Cabin</Typography><Typography variant="body2" fontWeight={600}>{selectedCabin?.name}</Typography></Grid>
                <Grid item xs={6}><Typography variant="caption" color="text.secondary">Time Slot</Typography><Typography variant="body2" fontWeight={600}>{selectedSlot?.label}</Typography></Grid>
              </Grid>
            </Box>
            <Button variant="contained" href="/student/interviews">View My Interviews</Button>
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Book an Interview</Typography>
        <Typography color="text.secondary" mb={3}>Select your preferences and reserve a slot</Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map(label => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 1: Technology & Interviewer */}
        {activeStep === 0 && (
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Select Technology & Interviewer</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Technology *</InputLabel>
                    <Select
                      value={form.technology_id}
                      label="Technology *"
                      onChange={e => setForm({ ...form, technology_id: e.target.value, interviewer_id: '' })}
                    >
                      {technologies.map(t => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Interviewer / Support Person *</InputLabel>
                    <Select
                      value={form.interviewer_id}
                      label="Interviewer / Support Person *"
                      onChange={e => setForm({ ...form, interviewer_id: e.target.value })}
                      disabled={!form.technology_id}
                    >
                      {filteredInterviewers.map(i => (
                        <MenuItem key={i.id} value={i.id}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{i.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{i.designation} • {i.experience_years}y exp</Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {form.technology_id && (
                <Box mt={2}>
                  <Alert severity="info" icon={<Schedule />}>
                    {filteredInterviewers.length} interviewer(s) available for {selectedTech?.name}
                  </Alert>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cabin & Slot */}
        {activeStep === 1 && (
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Choose Cabin & Time Slot</Typography>
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth label="Interview Date *" type="date"
                    value={form.interview_date}
                    onChange={e => setForm({ ...form, interview_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: new Date().toISOString().split('T')[0] }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Cabin *</InputLabel>
                    <Select value={form.cabin_id} label="Cabin *" onChange={e => setForm({ ...form, cabin_id: e.target.value, time_slot_id: '' })}>
                      {cabins.map(c => (
                        <MenuItem key={c.id} value={c.id}>{c.name} — {c.location}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {loading ? (
                <Box display="flex" justifyContent="center" py={4}><CircularProgress /></Box>
              ) : form.interview_date ? (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Available Time Slots</Typography>
                  {availableSlots.filter(c => !form.cabin_id || c.cabin_id === form.cabin_id).map((cabin: any) => (
                    <Box key={cabin.cabin_id} mb={3}>
                      <Typography variant="subtitle2" color="text.secondary" mb={1}>
                        📍 {cabin.cabin_name}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {cabin.slots.map((slot: any) => (
                          <Chip
                            key={slot.slot_id}
                            label={slot.label}
                            clickable={slot.is_available}
                            onClick={() => {
                              if (slot.is_available) {
                                setForm({ ...form, time_slot_id: slot.slot_id, cabin_id: cabin.cabin_id });
                              }
                            }}
                            color={form.time_slot_id === slot.slot_id ? 'primary' : 'default'}
                            variant={form.time_slot_id === slot.slot_id ? 'filled' : 'outlined'}
                            sx={{
                              opacity: slot.is_available ? 1 : 0.4,
                              cursor: slot.is_available ? 'pointer' : 'not-allowed',
                              fontSize: '0.82rem',
                            }}
                            icon={slot.is_available ? undefined : <span>🔒</span>}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">Please select a date to see available slots.</Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {activeStep === 2 && (
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} mb={3}>Confirm Your Booking</Typography>
              <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                <Grid container spacing={3}>
                  {[
                    { label: 'Technology', value: selectedTech?.name },
                    { label: 'Interviewer', value: selectedInterviewer?.name },
                    { label: 'Date', value: form.interview_date },
                    { label: 'Cabin', value: selectedCabin?.name },
                    { label: 'Time Slot', value: selectedSlot?.label },
                    { label: 'Interviewer Exp', value: `${selectedInterviewer?.experience_years || '—'} years` },
                  ].map(({ label, value }) => (
                    <Grid item xs={12} sm={6} key={label}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="body1" fontWeight={600}>{value || '—'}</Typography>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
              <Alert severity="warning" sx={{ mt: 2 }}>
                Please review your booking details carefully. Once confirmed, you can cancel from My Interviews.
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <Box display="flex" justifyContent="space-between" mt={3}>
          <Button variant="outlined" disabled={activeStep === 0} onClick={() => setActiveStep(s => s - 1)}>
            Back
          </Button>
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" disabled={!canNext()} onClick={() => setActiveStep(s => s + 1)}>
              Continue
            </Button>
          ) : (
            <Button variant="contained" color="success" disabled={submitting} onClick={handleBook} startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}>
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </Button>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
};

export default BookInterview;
