import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#1565C0',
      light: '#1E88E5',
      dark: '#0D47A1',
      contrastText: '#fff',
    },
    secondary: {
      main: '#00897B',
      light: '#26A69A',
      dark: '#00695C',
    },
    background: {
      default: '#F0F4F8',
      paper: '#FFFFFF',
    },
    success: { main: '#2E7D32' },
    warning: { main: '#F57C00' },
    error: { main: '#C62828' },
    info: { main: '#0277BD' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          borderRadius: 12,
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
        }
      }
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 500 } }
    },
    MuiTextField: {
      defaultProps: { size: 'small' }
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#1565C0',
            color: '#fff',
            fontWeight: 600,
          }
        }
      }
    }
  }
});

export const statusColors: Record<string, string> = {
  pending: '#FF8F00',
  scheduled: '#1565C0',
  in_progress: '#6A1B9A',
  completed: '#2E7D32',
  selected: '#1B5E20',
  rejected: '#C62828',
  cancelled: '#546E7A',
  active: '#2E7D32',
  inactive: '#C62828',
};
