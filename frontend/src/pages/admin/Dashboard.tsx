import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Button, Divider
} from '@mui/material';
import {
  People, EventNote, CheckCircle, GridView,
  Code, Person, Today, TrendingUp
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminApi } from '../../services/api';
import { statusColors } from '../../utils/theme';
import { MainLayout } from '../../layouts/MainLayout';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#1565C0', '#7B1FA2', '#2E7D32', '#F57C00', '#C62828', '#546E7A'];

const StatCard = ({ title, value, icon, color, subtitle, onClick }: any) => (
  <Card sx={{ cursor: onClick ? 'pointer' : 'default', '&:hover': onClick ? { transform: 'translateY(-2px)', transition: '0.2s' } : {} }} onClick={onClick}>
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [weekly, setWeekly] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard(),
      adminApi.listInterviews({ page: 1, size: 8 }),
      adminApi.weeklyReport(),
      adminApi.monthlyReport(),
    ]).then(([s, i, w, m]) => {
      setStats(s.data);
      setInterviews(i.data.items || []);
      setWeekly(w.data);
      setMonthly(m.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <MainLayout>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress size={48} /></Box>
    </MainLayout>
  );

  const statCards = [
    { title: 'Total Students', value: stats?.total_students ?? 0, icon: <People />, color: '#1565C0', subtitle: 'Registered students', path: '/admin/students' },
    { title: 'Active Students', value: stats?.active_students ?? 0, icon: <TrendingUp />, color: '#2E7D32', subtitle: 'Currently active' },
    { title: "Today's Interviews", value: stats?.todays_interviews ?? 0, icon: <Today />, color: '#7B1FA2', subtitle: 'Scheduled for today', path: '/admin/interviews' },
    { title: 'Completed', value: stats?.completed_interviews ?? 0, icon: <CheckCircle />, color: '#00897B', subtitle: 'All-time completed' },
    { title: 'Available Slots', value: stats?.available_slots ?? 0, icon: <GridView />, color: '#F57C00', subtitle: 'Open slots today' },
    { title: 'Technologies', value: stats?.technologies_count ?? 0, icon: <Code />, color: '#1565C0', subtitle: 'Active tech stacks', path: '/admin/technologies' },
    { title: 'Interviewers', value: stats?.interviewers_count ?? 0, icon: <Person />, color: '#C62828', subtitle: 'Active interviewers', path: '/admin/interviewers' },
  ];

  // Chart data from weekly report
  const weeklyChartData = weekly ? Object.entries(weekly.daily_breakdown || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    interviews: count,
  })) : [];

  const pieData = monthly ? [
    { name: 'Completed', value: monthly.completed },
    { name: 'Selected', value: monthly.selected },
    { name: 'Rejected', value: monthly.rejected },
    { name: 'Cancelled', value: monthly.cancelled },
  ].filter(d => d.value > 0) : [];

  return (
    <MainLayout>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={0.5}>Admin Dashboard</Typography>
        <Typography color="text.secondary" mb={3}>Overview of placement activities</Typography>

        {/* Stats */}
        <Grid container spacing={2.5} mb={3}>
          {statCards.map((c, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <StatCard {...c} onClick={c.path ? () => navigate(c.path!) : undefined} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          {/* Weekly Chart */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Weekly Interview Activity</Typography>
                {weeklyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="interviews" fill="#1565C0" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                    <Typography color="text.secondary">No data for this week</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Pie */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} mb={2}>Monthly Breakdown</Typography>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box display="flex" justifyContent="center" alignItems="center" height={220}>
                    <Typography color="text.secondary">No data this month</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Interviews */}
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={700}>Recent Interviews</Typography>
                  <Button size="small" onClick={() => navigate('/admin/interviews')}>View All</Button>
                </Box>

                {interviews.length === 0 ? (
                  <Box textAlign="center" py={4}>
                    <Typography color="text.secondary">No interviews scheduled yet</Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/admin/interviews')}>Schedule Interview</Button>
                  </Box>
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
                          <TableCell>Round</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {interviews.map((iv: any) => (
                          <TableRow key={iv.id} hover>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{iv.student?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">{iv.student?.student_id}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>{new Date(iv.interview_date).toLocaleDateString('en-IN')}</TableCell>
                            <TableCell>{iv.technology?.name}</TableCell>
                            <TableCell>{iv.interviewer?.name}</TableCell>
                            <TableCell>{iv.cabin?.name}</TableCell>
                            <TableCell>
                              <Chip label={iv.current_round?.replace('_', ' ')} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={iv.status.replace('_', ' ')}
                                size="small"
                                sx={{ bgcolor: `${statusColors[iv.status]}18`, color: statusColors[iv.status], fontWeight: 600, textTransform: 'capitalize' }}
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
        </Grid>
      </Box>
    </MainLayout>
  );
};

export default AdminDashboard;
