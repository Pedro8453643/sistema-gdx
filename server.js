require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const alunoRoutes = require('./routes/alunos');
const configRoutes = require('./routes/config');

const app = express();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sem origin (como mobile apps ou curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://prova-monitorada-frontend.vercel.app',
      'https://*.vercel.app',
      'https://*.railway.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requests por IP
  message: { error: 'Muitas requisições, tente novamente mais tarde.' }
});
app.use(limiter);

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alunos', alunoRoutes);
app.use('/api/config', configRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'Prova Monitorada Backend'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bem-vindo à API de Provas Monitoradas',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      alunos: '/api/alunos',
      config: '/api/config',
      health: '/health'
    },
    documentation: 'Consulte a documentação para mais informações'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
