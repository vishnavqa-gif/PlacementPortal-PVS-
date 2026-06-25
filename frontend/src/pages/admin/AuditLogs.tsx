import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  CircularProgress, TextField, InputAdornment, Pagination
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { adminApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const ACTION_COLORS: Record<string, any> = {
  USER_REGISTER: 'success', USER_LOGIN: 'info', USER_LOGOUT: 'default',
  STUDENT_ADD: 'success', STUDENT_DELETE: 'error', STUDENT_ACTIVATE: 'success', STUDENT_DEACTIVATE: 'warning',
  INTERVIEW_BOOK: 'primary', INTERVIEW_CANCEL: 'error', INTERVIEW_STATUS_UPDATE: 'info',
  ADMIN_ADD: 'success', ADMIN_REMOVE: 'error',
  TECHNOLOGY_ADD: 'success', TECHNOLOGY_DELETE: 'error',
  INTERVIEWER_ADD: 'success', INTERVIEWER_DELETE: 'error',
  FEEDBACK_ADD: 'info', ANNOUNCEMENT_POST: 'secondary',
};

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi.getAuditLogs({ page, size: 50 })
      .then(r => { setLogs(r.data.items); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [page]);

  const filtered = search
    ? logs.filter(l =>
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.description.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <MainLayout>
      <Box>
        <Box mb={3}>
          <Typography variant="h4" fontWeight={700}>Audit Logs</Typography>
          <Typography color="text.secondary">Complete history of all system actions</Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 2 }}>
            <TextField
              placeholder="Search by action or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              size="small"
              sx={{ mb: 2, width: 340 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>
              }}
            />

            {loading ? (
              <Box display="flex" justifyContent="center" py={5}><CircularProgress /></Box>
            ) : (
              <>
                <TableContainer sx={{ maxHeight: 520 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 160 }}>Timestamp</TableCell>
                        <TableCell sx={{ width: 200 }}>Action</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell sx={{ width: 120 }}>IP Address</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filtered.map((l: any) => (
                        <TableRow key={l.id} hover>
                          <TableCell>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                              {new Date(l.created_at).toLocaleString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={l.action}
                              size="small"
                              color={ACTION_COLORS[l.action] || 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.68rem', fontFamily: 'monospace' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{l.description}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              {l.ip_address || '—'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={Math.ceil(total / 50)}
                    page={page}
                    onChange={(_, v) => setPage(v)}
                    color="primary"
                    size="small"
                  />
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
};

export default AdminAuditLogs;
