// src/server.js - Serveur Express principal
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const widgetRoutes = require('./routes/widget');
const usersRoutes = require('./routes/users');

app.use('/api/auth', authRoutes);
app.use('/api/widget', widgetRoutes);
app.use('/api/users', usersRoutes);

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NEXA Auth API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    message: 'NEXA Authentication API for Unreal Engine 5',
    endpoints: {
      auth: '/api/auth',
      widget: '/api/widget',
      users: '/api/users',
      health: '/api/health'
    },
    documentation: 'https://docs.nexa-auth.com'
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.path,
    method: req.method
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur NEXA Auth API démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
});