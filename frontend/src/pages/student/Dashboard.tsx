import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Alert, CircularProgress, Avatar, Divider
} from '@mui/material';
import {
  Today, Schedule, CheckCircle, HourglassEmpty,
  TrendingUp, ArrowForward, Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { studentApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { statusColors } from '../../utils/theme';
import { MainLayout } from '../../layouts/MainLayout';

interface Stats { todays_interviews: number; upcoming_interviews: number; completed_interviews: number; pending_interviews: number; }
interface Interview {
  id: string; interview_date: string; status: string; current_round: string;
  technology?: { name: string }; interviewer?: { name: string }; cabin?: { name: string };
  time_slot?: { label: string };
}

const StatCard = ({ title, value, icon, color, subtitle }: any) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" mb={0.5}>{title}</Typography>
          <Typography variant="h3" fontWeight={800} color={color}>{value}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Avatar sx={{ bgcolor: `${color}18`, width: 52, height: 52 }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 28 } })}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      studentApi.getDashboard(),
      studentApi.getMyInterviews(),
      studentApi.getAnnouncements(),
    ]).then(([s, i, a]) => {
      setStats(s.data);
      setInterviews(i.data.slice(0, 5));
      setAnnouncements(a.data.slice(0, 3));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <MainLayout>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={48} />
      </Box>
    </MainLayout>
  );

  const statCards = [
    { title: "Today's Interviews", value: stats?.todays_interviews ?? 0, icon: <Today />, color: '#1565C0', subtitle: 'Scheduled for today' },
    { title: 'Upcoming Interviews', value: stats?.upcoming_interviews ?? 0, icon: <Schedule />, color: '#7B1FA2', subtitle: 'Future bookings' },
    { title: 'Completed', value: stats?.completed_interviews ?? 0, icon: <CheckCircle />, color: '#2E7D32', subtitle: 'All rounds done' },
    { title: 'Pending', value: stats?.pending_interviews ?? 0, icon: <HourglassEmpty />, color: '#F57C00', subtitle: 'Awaiting action' },
  ];

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box mb={3}>
          <Typography variant="h4" fontWeight={700}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.first_name}! 👋
          </Typography>
          <Typography color="text.secondary">Here's your placement journey at a glance</Typography>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={3} mb={3}>
          {statCards.map((c, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <StatCard {...c} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Interviews */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Recent Interviews</Typography>
                  <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/student/interviews')}>
                    View All
                  </Button>
                </Box>

                {interviews.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography variant="h2">📅</Typography>
                    <Typography color="text.secondary" mt={1}>No interviews yet</Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/student/book')}>
                      Book Your First Interview
                    </Button>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Technology</TableCell>
                          <TableCell>Cabin</TableCell>
                          <TableCell>Round</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {interviews.map(iv => (
                          <TableRow key={iv.id} hover>
                            <TableCell>{new Date(iv.interview_date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>{iv.technology?.name || '—'}</TableCell>
                            <TableCell>{iv.cabin?.name || '—'}</TableCell>
                            <TableCell>
                              <Chip label={iv.current_round?.replace('_', ' ')} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={iv.status}
                                size="small"
                                sx={{ bgcolor: `${statusColors[iv.status]}18`, color: statusColors[iv.status], fontWeight: 600 }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Announcements + Quick Actions */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Notifications color="primary" />
                  <Typography variant="h6" fontWeight={700}>Announcements</Typography>
                </Box>
                {announcements.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No announcements.</Typography>
                ) : (
                  announcements.map((a, i) => (
                    <Box key={a.id}>
                      <Box py={1.5}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Chip
                            label={a.priority}
                            size="small"
                            color={a.priority === 'high' ? 'error' : 'default'}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {new Date(a.created_at).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600}>{a.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {a.content}
                        </Typography>
                      </Box>
                      {i < announcements.length - 1 && <Divider />}
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Quick Actions</Typography>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Button variant="contained" fullWidth onClick={() => navigate('/student/book')} startIcon={<Schedule />}>
                    Book Interview
                  </Button>
                  <Button variant="outlined" fullWidth onClick={() => navigate('/student/profile')} startIcon={<TrendingUp />}>
                    Update Profile
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default StudentDashboard;
