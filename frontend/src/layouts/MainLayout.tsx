import React, { useState } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, IconButton, Avatar,
  Menu, MenuItem, Divider, Chip, useTheme, useMediaQuery
} from '@mui/material';
import {
  Dashboard, People, Work, MeetingRoom, AccessTime,
  Assignment, Announcement, Assessment, Menu as MenuIcon,
  Logout, Person, Settings, AdminPanelSettings,
  EventNote, TrendingUp, Business, SupervisorAccount, Article
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 260;

const studentNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/student/dashboard' },
  { label: 'My Interviews', icon: <EventNote />, path: '/student/interviews' },
  { label: 'Book Interview', icon: <Work />, path: '/student/book' },
  { label: 'My Profile', icon: <Person />, path: '/student/profile' },
  { label: 'Announcements', icon: <Announcement />, path: '/student/announcements' },
];

const adminNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
  { label: 'Students', icon: <People />, path: '/admin/students' },
  { label: 'Interviews', icon: <EventNote />, path: '/admin/interviews' },
  { label: 'Technologies', icon: <Business />, path: '/admin/technologies' },
  { label: 'Interviewers', icon: <SupervisorAccount />, path: '/admin/interviewers' },
  { label: 'Cabins', icon: <MeetingRoom />, path: '/admin/cabins' },
  { label: 'Time Slots', icon: <AccessTime />, path: '/admin/slots' },
  { label: 'Announcements', icon: <Announcement />, path: '/admin/announcements' },
  { label: 'Reports', icon: <Assessment />, path: '/admin/reports' },
  { label: 'Audit Logs', icon: <Article />, path: '/admin/audit-logs' },
];

const superAdminNav = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/super-admin/dashboard' },
  { label: 'Admins', icon: <AdminPanelSettings />, path: '/super-admin/admins' },
  { label: 'System Settings', icon: <Settings />, path: '/super-admin/settings' },
  { label: 'Audit Logs', icon: <Article />, path: '/super-admin/audit-logs' },
];

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const navItems = isSuperAdmin ? superAdminNav : isAdmin ? adminNav : studentNav;

  const roleLabel = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Student';
  const roleColor = isSuperAdmin ? 'error' : isAdmin ? 'warning' : 'primary';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0D47A1' }}>
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
          🎯 Placement Portal
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
          Interview Management System
        </Typography>
      </Box>

      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2,
                  bgcolor: active ? 'rgba(255,255,255,0.18)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.75)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: 'white' },
                  py: 1.2,
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 38 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: active ? 600 : 400 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}>
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, truncate: true }}>
              {user?.first_name} {user?.last_name}
            </Typography>
            <Chip label={roleLabel} size="small" color={roleColor as any} sx={{ height: 16, fontSize: '0.65rem' }} />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box', border: 'none' }
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid #E0E0E0' }}>
          <Toolbar>
            {isMobile && (
              <IconButton edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="subtitle2">{user?.first_name} {user?.last_name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { navigate(isAdmin ? '/admin/profile' : '/student/profile'); setAnchorEl(null); }}>
                <ListItemIcon><Person fontSize="small" /></ListItemIcon> Profile
              </MenuItem>
              <MenuItem onClick={() => { logout(); setAnchorEl(null); }}>
                <ListItemIcon><Logout fontSize="small" /></ListItemIcon> Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};
