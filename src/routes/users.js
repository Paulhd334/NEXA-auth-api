// src/routes/users.js
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const usersFilePath = path.join(__dirname, '../data/users.json');

// Middleware admin
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Accès administrateur requis'
    });
  }
  
  next();
};

// GET /api/users - Lister les utilisateurs
router.get('/', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '',
      sortBy = 'lastLogin',
      order = 'desc'
    } = req.query;
    
    // Lire les utilisateurs
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      users = [];
    }
    
    // Filtrer
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchLower) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchLower)) ||
        user.uid.toLowerCase().includes(searchLower)
      );
    }
    
    // Trier
    filteredUsers.sort((a, b) => {
      const aVal = a[sortBy] || '';
      const bVal = b[sortBy] || '';
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
    
    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = pageNum * limitNum;
    
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    // Statistiques
    const stats = {
      total: filteredUsers.length,
      active: filteredUsers.filter(u => u.status === 'active').length,
      today: filteredUsers.filter(u => {
        const lastLogin = new Date(u.lastLogin);
        const today = new Date();
        return lastLogin.toDateString() === today.toDateString();
      }).length,
      byProvider: filteredUsers.reduce((acc, user) => {
        acc[user.provider] = (acc[user.provider] || 0) + 1;
        return acc;
      }, {})
    };
    
    return res.status(200).json({
      success: true,
      data: paginatedUsers.map(user => ({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        provider: user.provider,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        loginCount: user.loginCount || 0
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limitNum),
        hasNext: endIndex < filteredUsers.length,
        hasPrev: startIndex > 0
      },
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur route /api/users:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// GET /api/users/:userId - Obtenir un utilisateur spécifique
router.get('/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Lire les utilisateurs
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      users = [];
    }
    
    const user = users.find(u => u.uid === userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Retourner les données utilisateur (sans tokens sensibles)
    const safeUser = { ...user };
    delete safeUser.tokens;
    
    return res.status(200).json({
      success: true,
      data: safeUser,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur route /api/users/:userId:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

// DELETE /api/users/:userId - Supprimer un utilisateur
router.delete('/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Lire les utilisateurs
    let users = [];
    try {
      const data = await fs.readFile(usersFilePath, 'utf8');
      users = JSON.parse(data);
    } catch (error) {
      users = [];
    }
    
    const initialLength = users.length;
    users = users.filter(user => user.uid !== userId);
    
    if (users.length === initialLength) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }
    
    // Sauvegarder
    await fs.writeFile(usersFilePath, JSON.stringify(users, null, 2));
    
    return res.status(200).json({
      success: true,
      message: `Utilisateur ${userId} supprimé avec succès`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur route DELETE /api/users/:userId:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

module.exports = router;