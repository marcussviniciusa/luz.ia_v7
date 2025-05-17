import { createTheme } from '@mui/material/styles';

// Paleta de cores definida nos requisitos
// Verde Esmeralda como cor principal
// Detalhes dourados para elementos de destaque
// Fundo verde texturizado
// Tipografia em tons claros

const theme = createTheme({
  palette: {
    primary: {
      main: '#1B5E20', // Verde Esmeralda
      light: '#2E7D32',
      dark: '#0F3F12',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFD700', // Dourado
      light: '#FFDF4F',
      dark: '#D6B800',
      contrastText: '#212121',
    },
    background: {
      default: '#F8F8F8',
      paper: '#FFFFFF',
      emerald: '#2E7D32', // Verde texturizado para fundos
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      light: '#FFFFFF',
    },
    success: {
      main: '#4CAF50',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#F9A825',
    },
    info: {
      main: '#0288D1',
    },
  },
  typography: {
    fontFamily: "'Montserrat', 'Roboto', 'Helvetica', 'Arial', sans-serif",
    h1: {
      fontWeight: 600,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.8rem',
    },
    h4: {
      fontWeight: 500,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.3rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0F3F12 0%, #1B5E20 100%)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #FFD700 0%, #FFDF4F 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #D6B800 0%, #FFD700 100%)',
          },
        },
        outlined: {
          borderWidth: '2px',
          '&:hover': {
            borderWidth: '2px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 6px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: '#1B5E20 #F5F5F5',
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#F5F5F5',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#1B5E20',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#0F3F12',
            },
          },
        },
      },
    },
  },
});

export default theme;
