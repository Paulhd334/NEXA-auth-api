// src/routes/widget.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');

// GET /api/widget - Récupérer les données du widget
router.get('/', async (req, res) => {
  try {
    const { userId, email } = req.query;
    
    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        error: 'userId ou email requis'
      });
    }
    
    // Lire les utilisateurs
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      users = [];
    }
    
    // Trouver l'utilisateur
    let user = null;
    if (userId) {
      user = users.find(u => u.uid === userId);
    } else if (email) {
      user = users.find(u => u.email === email);
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        widget: null
      });
    }
    
    // Formater les données pour le widget
    const widgetData = {
      userId: user.uid,
      userEmail: user.email,
      userName: user.displayName || 'Utilisateur NEXA',
      userAvatar: user.photoURL || null,
      status: 'connected',
      unrealEngine: {
        connected: true,
        sessionActive: true,
        lastSync: user.lastLogin || new Date().toISOString(),
        version: user.metadata?.unrealEngineVersion || '5.3'
      },
      stats: {
        loginCount: user.loginCount || 1,
        firstLogin: user.createdAt,
        lastActive: user.lastLogin,
        accountAge: Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) + ' jours'
      },
      quickActions: [
        { id: 'sync', label: 'Synchroniser UE5', icon: 'sync' },
        { id: 'profile', label: 'Voir profil', icon: 'user' },
        { id: 'logout', label: 'Déconnexion', icon: 'logout' }
      ]
    };
    
    return res.status(200).json({
      success: true,
      data: widgetData,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur route /api/widget:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// POST /api/widget - Mettre à jour les données du widget
router.post('/', async (req, res) => {
  try {
    const { userId, ...widgetData } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId requis'
      });
    }
    
    // Lire les utilisateurs
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      users = [];
    }
    
    // Trouver et mettre à jour l'utilisateur
    const userIndex = users.findIndex(u => u.uid === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Mettre à jour les données widget
    users[userIndex] = {
      ...users[userIndex],
      ...(widgetData.userName && { displayName: widgetData.userName }),
      ...(widgetData.userAvatar && { photoURL: widgetData.userAvatar }),
      updatedAt: new Date().toISOString(),
      widget: {
        ...users[userIndex].widget,
        ...widgetData,
        lastUpdate: new Date().toISOString()
      }
    };
    
    // Sauvegarder
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
    
    return res.status(200).json({
      success: true,
      message: 'Widget mis à jour avec succès',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur route POST /api/widget:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;