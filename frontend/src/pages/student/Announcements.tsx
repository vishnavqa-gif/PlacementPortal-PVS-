import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, CircularProgress,
  Divider, Alert
} from '@mui/material';
import { Announcement as AnnouncementIcon, NotificationsActive } from '@mui/icons-material';
import { studentApi } from '../../services/api';
import { MainLayout } from '../../layouts/MainLayout';

const StudentAnnouncements = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentApi.getAnnouncements()
      .then(r => setAnnouncements(r.data))
      .finally(() => setLoading(false));
  }, []);

  const priorityColor = (p: string) =>
    p === 'high' ? 'error' : p === 'medium' ? 'warning' : 'info';

  const priorityIcon = (p: string) =>
    p === 'high' ? '🔴' : p === 'medium' ? '🟡' : '🔵';

  return (
    <MainLayout>
      <Box>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <NotificationsActive color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>Announcements</Typography>
            <Typography color="text.secondary">Latest updates from the placement team</Typography>
          </Box>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>
        ) : announcements.length === 0 ? (
          <Box textAlign="center" py={8}>
            <AnnouncementIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No announcements right now</Typography>
            <Typography variant="body2" color="text.disabled">Check back later for updates</Typography>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {announcements.map((a: any, i: number) => (
              <Card
                key={a.id}
                sx={{
                  borderLeft: '4px solid',
                  borderLeftColor: a.priority === 'high' ? 'error.main' : a.priority === 'medium' ? 'warning.main' : 'primary.main',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="h6" fontWeight={700}>{priorityIcon(a.priority)} {a.title}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={a.priority}
                        size="small"
                        color={priorityColor(a.priority) as any}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(a.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7 }}>
                    {a.content}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </MainLayout>
  );
};

export default StudentAnnouncements;
