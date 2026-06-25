import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Tabs, Tab,
  CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, Chip, TextField
} from '@mui/material';
import { PictureAsPdf, TableChart, BarChart as BarChartIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const AdminReports = () => {
  const [tab, setTab] = useState(0);
  const [daily, setDaily] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.dailyReport(reportDate),
      adminApi.weeklyReport(),
      adminApi.monthlyReport(),
    ]).then(([d, w, m]) => {
      setDaily(d.data);
      setWeekly(w.data);
      setMonthly(m.data);
    }).finally(() => setLoading(false));
  }, [reportDate]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    setExporting(type);
    try {
      const res = type === 'excel' ? await adminApi.exportExcel() : await adminApi.exportPdf();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `interviews_report.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
    } catch {
      alert('Export failed');
    } finally {
      setExporting(null);
    }
  };

  const weeklyChartData = weekly ? Object.entries(weekly.daily_breakdown || {}).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    count: count as number,
  })) : [];

  return (
    <MainLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight={700}>Reports</Typography>
            <Typography color="text.secondary">Analytics and interview statistics</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined" startIcon={exporting === 'excel' ? <CircularProgress size={16} /> : <TableChart />}
              disabled={Boolean(exporting)} onClick={() => handleExport('excel')}
              color="success"
            >
              Export Excel
            </Button>
            <Button
              variant="outlined" startIcon={exporting === 'pdf' ? <CircularProgress size={16} /> : <PictureAsPdf />}
              disabled={Boolean(exporting)} onClick={() => handleExport('pdf')}
              color="error"
            >
              Export PDF
            </Button>
          </Box>
        </Box>

        <Card sx={{ mb: 3 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid #E0E0E0', px: 2 }}>
            <Tab label="Daily Report" />
            <Tab label="Weekly Report" />
            <Tab label="Monthly Report" />
          </Tabs>

          <CardContent sx={{ p: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            ) : (
              <>
                {/* Daily */}
                {tab === 0 && (
                  <Box>
                    <Box display="flex" gap={2} alignItems="center" mb={3}>
                      <TextField
                        type="date" label="Select Date" value={reportDate}
                        onChange={e => setReportDate(e.target.value)}
                        InputLabelProps={{ shrink: true }} size="small"
                      />
                    </Box>

                    {daily && (
                      <>
                        <Grid container spacing={2} mb={3}>
                          <Grid item xs={6} md={3}>
                            <Card variant="outlined">
                              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                <Typography variant="h3" fontWeight={800} color="primary">{daily.total}</Typography>
                                <Typography variant="body2" color="text.secondary">Total Interviews</Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                          {Object.entries(daily.by_status || {}).map(([status, count]) => (
                            <Grid item xs={6} md={3} key={status}>
                              <Card variant="outlined">
                                <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                  <Typography variant="h3" fontWeight={800}>{count as number}</Typography>
                                  <Chip label={status.replace('_', ' ')} size="small" sx={{ textTransform: 'capitalize' }} />
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                        {daily.total === 0 && <Alert severity="info">No interviews found for {reportDate}.</Alert>}
                      </>
                    )}
                  </Box>
                )}

                {/* Weekly */}
                {tab === 1 && (
                  <Box>
                    <Typography variant="subtitle1" mb={1} color="text.secondary">
                      {weekly?.start_date} — {weekly?.end_date}
                    </Typography>
                    <Grid container spacing={2} mb={3}>
                      <Grid item xs={6} md={3}>
                        <Card variant="outlined">
                          <CardContent sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h3" fontWeight={800} color="primary">{weekly?.total}</Typography>
                            <Typography variant="body2" color="text.secondary">This Week</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {weeklyChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#1565C0" radius={[4, 4, 0, 0]} name="Interviews" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">No interview data for this week.</Alert>
                    )}
                  </Box>
                )}

                {/* Monthly */}
                {tab === 2 && (
                  <Box>
                    <Typography variant="subtitle1" mb={2} color="text.secondary">
                      {new Date(monthly?.year, monthly?.month - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Total', value: monthly?.total, color: 'primary.main' },
                        { label: 'Completed', value: monthly?.completed, color: 'success.main' },
                        { label: 'Selected', value: monthly?.selected, color: '#1B5E20' },
                        { label: 'Rejected', value: monthly?.rejected, color: 'error.main' },
                        { label: 'Cancelled', value: monthly?.cancelled, color: 'text.secondary' },
                      ].map(({ label, value, color }) => (
                        <Grid item xs={6} md={2.4} key={label}>
                          <Card variant="outlined" sx={{ textAlign: 'center' }}>
                            <CardContent sx={{ p: 2 }}>
                              <Typography variant="h3" fontWeight={800} color={color}>{value ?? 0}</Typography>
                              <Typography variant="body2" color="text.secondary">{label}</Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                      {monthly?.total > 0 && (
                        <Grid item xs={12}>
                          <Alert severity="success">
                            Selection rate: <strong>{monthly?.total > 0 ? Math.round((monthly?.selected / monthly?.total) * 100) : 0}%</strong>
                          </Alert>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default AdminReports;
