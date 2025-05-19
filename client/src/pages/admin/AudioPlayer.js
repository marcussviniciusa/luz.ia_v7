import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  IconButton, 
  Button,
  Typography,
  Box,
  LinearProgress,
  Stack
} from '@mui/material';
import { Close as CloseIcon, PlayArrow, Pause } from '@mui/icons-material';

const AudioPlayer = ({ open, onClose, title, audioPath }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [isRealAudio, setIsRealAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  
  // Refs para áudio real
  const audioRef = useRef(null);
  
  // Refs para áudio gerado (fallback)
  const audioContext = useRef(null);
  const oscillator = useRef(null);
  const gainNode = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Carregar arquivo de áudio do MinIO
  const loadAudioFile = useCallback(async () => {
    if (!audioPath || audioPath.trim() === '') {
      console.log('Nenhum caminho de áudio fornecido');
      setIsRealAudio(false);
      return;
    }
    
    // IMPORTANTE: Verificar logs detalhados para diagnosticar o problema
    console.log('====== DIAGNOSTICO DE AUDIO ======')
    console.log('audioPath recebido:', audioPath);
    console.log('Tipo:', typeof audioPath);
    console.log('Comprimento:', audioPath.length);
    console.log('==================================');
    
    try {
      console.log('Verificando existência do arquivo:', audioPath);
      
      // Verificar se o arquivo existe fazendo uma requisição HEAD
      await axios.head(`/api/proxy/minio/${audioPath}`);
      
      // Se chegar aqui, o arquivo existe
      const url = `/api/proxy/minio/${audioPath}`;
      setAudioUrl(url);
      setIsRealAudio(true);
      setAudioError(false);
      console.log('Arquivo de áudio encontrado:', url);
    } catch (error) {
      console.log('Arquivo de áudio não encontrado:', error);
      setIsRealAudio(false);
      setAudioError(true);
      
      // Mostrar uma mensagem mais específica no log
      if (error.response) {
        console.log('Erro de resposta:', error.response.status, error.response.data);
        
        // Adicionar mensagem personalizada para o erro 404
        if (error.response.status === 404) {
          console.log('Arquivo não existe no bucket do MinIO. Usando tom de demonstração.');
        }
      } else if (error.request) {
        console.log('Erro de request (sem resposta):', error.request);
      } else {
        console.log('Erro ao configurar request:', error.message);
      }
    }
  }, [audioPath]);
  
  // Iniciar ou parar o som
  const togglePlayPause = () => {
    if (isPlaying) {
      stopSound();
    } else {
      if (isRealAudio && audioRef.current) {
        playRealAudio();
      } else {
        playSound(); // Fallback para áudio gerado
      }
    }
  };
  
  // Reproduzir arquivo de áudio real
  const playRealAudio = () => {
    if (!audioRef.current) return;
    
    console.log('Tentando reproduzir áudio real de:', audioRef.current.src);
    
    // Parar qualquer reprodução anterior
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Garantir que o áudio esteja pronto antes de tentar reproduzir
    const prepareAndPlay = async () => {
      try {
        // Garantir que o áudio está pausado antes de tentar carregá-lo novamente
        audioRef.current.pause();
        
        // Forçar o carregamento do áudio
        audioRef.current.load();
        
        // Aguardar um tempo para garantir que o carregamento inicie
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!audioRef.current) return; // Verificar se o componente ainda está montado
        
        // Tentar reproduzir o áudio
        await audioRef.current.play();
        
        console.log('Áudio iniciado com sucesso!');
        setIsPlaying(true);
        
        // Atualizar o tempo atual a cada segundo
        intervalRef.current = setInterval(() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }, 1000);
      } catch (error) {
        console.error('Erro ao reproduzir áudio:', error);
        setAudioError(true);
        
        // Log detalhado do erro
        console.log('Detalhes do erro ao reproduzir:', {
          name: error.name,
          message: error.message,
          audioSrc: audioRef.current ? audioRef.current.src : 'audio ref não disponível'
        });
        
        // Verificar conexão com o MinIO se o URL estiver definido
        if (audioUrl) {
          axios.head(audioUrl)
            .then(response => {
              console.log('Arquivo existe no MinIO, mas não pode ser reproduzido:', response);
            })
            .catch(err => {
              console.log('Arquivo não existe no MinIO:', err);
            });
        }
        
        // Fallback para áudio gerado
        playSound();
      }
    };
    
    // Iniciar o processo de reprodução
    prepareAndPlay();
  };
  
  // Reproduzir um tom de meditação (432Hz)
  const playSound = () => {
    try {
      // Inicializar o contexto de áudio
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      
      // Criar oscilador e controlador de volume
      oscillator.current = audioContext.current.createOscillator();
      gainNode.current = audioContext.current.createGain();
      
      // Configurar frequência e tipo de onda
      oscillator.current.type = 'sine';
      oscillator.current.frequency.setValueAtTime(432, audioContext.current.currentTime);
      
      // Configurar volume
      gainNode.current.gain.setValueAtTime(0.2, audioContext.current.currentTime);
      
      // Conectar nós
      oscillator.current.connect(gainNode.current);
      gainNode.current.connect(audioContext.current.destination);
      
      // Iniciar oscilador
      oscillator.current.start();
      
      // Atualizar estado
      setIsPlaying(true);
      startTimeRef.current = Date.now();
      
      // Atualizar temporizador a cada segundo
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setCurrentTime(elapsed);
        
        if (elapsed >= duration) {
          stopSound();
        }
      }, 1000);
    } catch (error) {
      console.error('Erro ao iniciar reprodução de áudio:', error);
    }
  };
  
  // Parar a reprodução
  const stopSound = useCallback(() => {
    // Limpar o intervalo que atualiza o tempo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Redefinir o tempo atual
    setCurrentTime(0);
    startTimeRef.current = null;
    
    try {
      // Se estivermos reproduzindo o áudio real
      if (isRealAudio && audioRef.current) {
        // Guardar uma referência local para evitar problemas com o React
        const audio = audioRef.current;
        
        // Pausar o áudio antes de qualquer outra operação
        audio.pause();
        
        // Silenciar o áudio para evitar picos de som durante a parada
        try {
          audio.volume = 0;
        } catch (err) {
          console.log('Erro ao ajustar volume:', err);
        }
        
        // Redefinir a posição do áudio com try/catch para lidar com possíveis erros
        try {
          audio.currentTime = 0;
        } catch (err) {
          console.log('Erro ao redefinir currentTime:', err);
        }
      }
      
      // Lidar com oscilador de áudio, se existir
      if (oscillator.current) {
        try {
          oscillator.current.stop();
          oscillator.current.disconnect();
          oscillator.current = null;
        } catch (err) {
          console.log('Erro ao parar oscilador:', err);
        }
      }
      
      // Lidar com o nó de ganho, se existir
      if (gainNode.current) {
        try {
          gainNode.current.disconnect();
          gainNode.current = null;
        } catch (err) {
          console.log('Erro ao desconectar gainNode:', err);
        }
      }
      
      // Desativar flag de reprodução
      setIsPlaying(false);
    } catch (error) {
      console.error('Erro ao parar reprodução de áudio:', error);
    }
  }, [isRealAudio]);
  
  // Formatar tempo (segundos para MM:SS)
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Verificar e carregar o arquivo de áudio quando o componente é montado
  // Colocado aqui para evitar a referência circular
  useEffect(() => {
    if (open) {
      console.log('AudioPlayer aberto, configurando...');
      
      // Limpar qualquer estado anterior quando o player é aberto novamente
      setCurrentTime(0);
      setIsPlaying(false);
      setAudioError(false);
      
      // Esperar um pouco antes de inicializar o áudio para garantir que o DOM esteja pronto
      const initTimeout = setTimeout(() => {
        if (audioPath && audioPath.trim() !== '') {
          console.log('Carregando arquivo de áudio:', audioPath);
          loadAudioFile();
        } else {
          // Se não há caminho de áudio, usamos o modo de fallback automaticamente
          setIsRealAudio(false);
          console.log('Nenhum arquivo de áudio fornecido, usando áudio gerado');
        }
      }, 200);
      
      // Limpar timeout se o componente for desmontado
      return () => clearTimeout(initTimeout);
    }
    
    // Capturar uma refência ao elemento de áudio atual para evitar problemas de cleanup
    const currentAudioRef = audioRef.current;
    
    return () => {
      // Limpar recursos quando o componente é desmontado
      if (oscillator.current) {
        stopSound();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (currentAudioRef) {
        try {
          currentAudioRef.pause();
          currentAudioRef.currentTime = 0;
        } catch (err) {
          console.log('Erro durante cleanup do áudio:', err);
        }
      }
    };
  }, [open, audioPath, loadAudioFile, stopSound]);
  
  return (
    <Dialog 
      open={open} 
      onClose={() => {
        stopSound();
        onClose();
      }}
      maxWidth="sm"
      fullWidth
    >
      {/* Elemento de áudio oculto para reprodução de arquivos reais */}
      <audio 
        ref={audioRef} 
        src={isRealAudio ? audioUrl : ''}
        preload="auto"
        crossOrigin="anonymous"
        playsInline
        onLoadedMetadata={() => {
          if (audioRef.current) {
            console.log('Áudio carregado com duração:', audioRef.current.duration);
            setDuration(audioRef.current.duration || 300);
          }
        }}
        onEnded={() => {
          console.log('Áudio concluído');
          setIsPlaying(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }}
        onError={(e) => {
          console.log('Erro no elemento de áudio:', e.target.error);
          setAudioError(true);
        }}
        style={{ display: 'none' }}
      />
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          Reprodução de Áudio
          <IconButton edge="end" color="inherit" onClick={() => {
            stopSound();
            onClose();
          }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box textAlign="center" py={3}>
          <Typography variant="h6" gutterBottom>
            {title || 'Meditação Guiada'}
          </Typography>
          
          {audioError && (
            <Typography variant="caption" color="error" gutterBottom>
              Arquivo original não encontrado. Usando áudio de demonstração.
            </Typography>
          )}
          
          {(!audioPath || audioPath.trim() === '') && (
            <Typography variant="caption" color="info.main" gutterBottom>
              Nenhum arquivo de áudio foi associado a esta prática. Reproduzindo tom padrão de meditação (432Hz).
            </Typography>
          )}
          
          <Box sx={{ width: '100%', mt: 4, mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={(currentTime / duration) * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            
            <Box display="flex" justifyContent="space-between" mt={1}>
              <Typography variant="body2" color="text.secondary">
                {formatTime(currentTime)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatTime(duration)}
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
            <Button 
              variant="contained" 
              color={isPlaying ? "secondary" : "primary"}
              onClick={togglePlayPause}
              startIcon={isPlaying ? <Pause /> : <PlayArrow />}
              size="large"
            >
              {isPlaying ? 'Pausar' : 'Reproduzir'}
            </Button>
          </Stack>
          
          <Typography variant="body2" color="text.secondary" mt={4}>
            Utilize esta meditação para relaxar e concentrar-se em seus objetivos positivos.
          </Typography>
          
          <Typography variant="caption" display="block" mt={3} color="text.disabled">
            {isRealAudio ? 'Reproduzindo arquivo de áudio' : 'Reproduzindo tom 432Hz - Frequência de relaxamento e meditação'}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default AudioPlayer;
