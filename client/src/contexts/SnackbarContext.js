import React, { createContext, useState } from 'react';
import { Snackbar, Alert } from '@mui/material';

export const SnackbarContext = createContext();

export const SnackbarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');
  const [duration, setDuration] = useState(6000);

  const showSnackbar = (newMessage, newSeverity = 'info', newDuration = 6000) => {
    setMessage(newMessage);
    setSeverity(newSeverity);
    setDuration(newDuration);
    setOpen(true);
  };

  const showSuccess = (msg, newDuration) => showSnackbar(msg, 'success', newDuration);
  const showError = (msg, newDuration) => showSnackbar(msg, 'error', newDuration);
  const showWarning = (msg, newDuration) => showSnackbar(msg, 'warning', newDuration);
  const showInfo = (msg, newDuration) => showSnackbar(msg, 'info', newDuration);

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <SnackbarContext.Provider
      value={{
        showSnackbar,
        showSuccess,
        showError,
        showWarning,
        showInfo
      }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={duration}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};
