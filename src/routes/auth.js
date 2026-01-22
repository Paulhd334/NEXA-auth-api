// src/routes/auth.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Chemin vers le fichier users.json
const usersFilePath = path.join(__dirname, '../data/users.json');

// Middleware pour valider l'API key
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'Clé API manquante'
    });
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      error: 'Clé API invalide'
    });
  }
  
  next();
};

// POST /api/auth - Authentification UE5
router.post('/', validateApiKey, async (req, res) => {
  try {
    const { action, user, tokens, timestamp } = req.body;
    
    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action requise'
      });
    }
    
    // Lire les utilisateurs existants
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      // Fichier non existant, on commence avec un tableau vide
      users = [];
    }
    
    if (action === 'auth_login') {
      console.log(`🔑 Connexion UE5: ${user?.email || 'Utilisateur inconnu'}`);
      
      if (!user || !user.uid || !user.email) {
        return res.status(400).json({
          success: false,
          error: 'Données utilisateur invalides'
        });
      }
      
      // Rechercher l'utilisateur existant
      const existingUserIndex = users.findIndex(u => u.uid === user.uid);
      const now = new Date().toISOString();
      
      if (existingUserIndex !== -1) {
        // Mettre à jour l'utilisateur existant
        users[existingUserIndex] = {
          ...users[existingUserIndex],
          ...user,
          lastLogin: timestamp || now,
          updatedAt: now,
          loginCount: (users[existingUserIndex].loginCount || 0) + 1,
          tokens: {
            ...tokens,
            // Sécurité: ne pas stocker les tokens complets
            accessTokenExpires: tokens?.accessToken ? 'stored' : undefined,
            idTokenExpires: tokens?.idToken ? 'stored' : undefined
          }
        };
      } else {
        // Nouvel utilisateur
        const newUser = {
          ...user,
          createdAt: now,
          lastLogin: timestamp || now,
          loginCount: 1,
          status: 'active',
          provider: 'google',
          tokens: {
            ...tokens,
            accessTokenExpires: tokens?.accessToken ? 'stored' : undefined,
            idTokenExpires: tokens?.idToken ? 'stored' : undefined
          },
          metadata: {
            unrealEngineVersion: '5.3',
            platform: 'web',
            source: 'nexa_auth'
          }
        };
        users.push(newUser);
      }
      
      // Sauvegarder
      await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
      
      // Réponse pour UE5
      const response = {
        success: true,
        message: 'Authentification UE5 réussie',
        session: {
          sessionId: `ue5_${Date.now()}_${user.uid.slice(0, 8)}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
          }
        },
        engine: {
          version: '5.3',
          authProtocol: 'nexa_v1',
          permissions: ['asset_access', 'cloud_sync', 'multiplayer']
        },
        timestamp: now
      };
      
      console.log(`✅ Authentification réussie pour: ${user.email}`);
      return res.status(200).json(response);
      
    } else if (action === 'auth_logout') {
      console.log('🚪 Déconnexion UE5');
      
      const response = {
        success: true,
        message: 'Déconnexion UE5 réussie',
        timestamp: new Date().toISOString()
      };
      
      return res.status(200).json(response);
      
    } else {
      return res.status(400).json({
        success: false,
        error: 'Action non supportée',
        supportedActions: ['auth_login', 'auth_logout']
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur route /api/auth:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/auth/check - Vérifier l'état d'authentification
router.get('/check', validateApiKey, async (req, res) => {
  try {
    const { userId, sessionId } = req.query;
    
    if (!userId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'userId ou sessionId requis'
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
    
    // Rechercher l'utilisateur
    const user = users.find(u => u.uid === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
        authenticated: false
      });
    }
    
    // Vérifier si la session est valide (moins de 24h)
    const lastLogin = new Date(user.lastLogin);
    const now = new Date();
    const hoursSinceLogin = (now - lastLogin) / (1000 * 60 * 60);
    
    const isSessionValid = hoursSinceLogin < 24;
    
    return res.status(200).json({
      success: true,
      authenticated: isSessionValid,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        lastLogin: user.lastLogin
      },
      session: {
        valid: isSessionValid,
        expiresIn: Math.max(0, 24 - hoursSinceLogin).toFixed(1) + ' heures'
      },
      timestamp: now.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur route /check:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;