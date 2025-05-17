import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper,
  Container
} from '@mui/material';
import { 
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: 'rgba(0, 0, 0, 0.02)',
  border: '1px dashed rgba(0, 0, 0, 0.1)',
}));

function NotFound() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8 }}>
        <StyledPaper>
          <SentimentDissatisfiedIcon sx={{ fontSize: 80, color: 'rgba(0,0,0,0.2)', mb: 2 }} />
          
          <Typography variant="h4" gutterBottom>
            Página Não Encontrada
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ maxWidth: 500, mb: 4 }}>
            Desculpe, a página que você está procurando não existe ou foi movida.
            Talvez você tenha digitado o endereço incorretamente ou a página tenha sido removida.
          </Typography>
          
          <Button 
            component={RouterLink} 
            to="/" 
            variant="contained" 
            color="primary"
            startIcon={<HomeIcon />}
            size="large"
          >
            Voltar para o Início
          </Button>
        </StyledPaper>
      </Box>
    </Container>
  );
}

export default NotFound;
