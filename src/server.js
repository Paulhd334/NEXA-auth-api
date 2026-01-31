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

// ROUTE ASCENSEUR DIRECTE (ajoutée ici)
app.get('/api/elevator', (req, res) => {
    const { 
        floor = -1, 
        action = 'descend', 
        timestamp, 
        user = 'ascenseur_interface', 
        status = 'moving',
        device = 'elevator_panel'
    } = req.query;

    // Log dans la console serveur
    console.log('🛗 [ASCENSEUR] Action reçue:', {
        floor: parseInt(floor),
        action,
        timestamp: timestamp ? new Date(parseInt(timestamp)).toISOString() : new Date().toISOString(),
        user,
        status,
        device,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        receivedAt: new Date().toISOString()
    });

    // Réponse JSON
    res.json({
        success: true,
        message: 'Action ascenseur enregistrée',
        data: {
            floor: parseInt(floor),
            action,
            timestamp: new Date(),
            nextAction: 'processing',
            estimatedTime: '5s'
        },
        metadata: {
            apiVersion: '1.0.0',
            service: 'NEXA Auth API - Elevator Module'
        }
    });
});

// Route POST pour ascenseur (alternative)
app.post('/api/elevator', (req, res) => {
    const elevatorData = req.body;

    console.log('🛗 [ASCENSEUR] Données POST reçues:', {
        ...elevatorData,
        ip: req.ip,
        receivedAt: new Date().toISOString()
    });

    res.json({
        success: true,
        message: 'Données ascenseur reçues',
        data: elevatorData,
        processedAt: new Date().toISOString()
    });
});

// Route santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'NEXA Auth API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: ['auth', 'widget', 'users', 'elevator', 'health']
  });
});

// Route racine (mise à jour)
app.get('/', (req, res) => {
  res.json({
    message: 'NEXA Authentication API for Unreal Engine 5',
    endpoints: {
      auth: '/api/auth',
      widget: '/api/widget',
      users: '/api/users',
      elevator: '/api/elevator', // ← NOUVEAU
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
    method: req.method,
    availableEndpoints: ['/api/auth', '/api/widget', '/api/users', '/api/elevator', '/api/health']
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
  console.log(`🛗 Route ascenseur: http://localhost:${PORT}/api/elevator`);
});
