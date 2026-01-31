// src/server.js - Serveur Express principal CORRIGÉ
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

// ROUTE ASCENSEUR DIRECTE - CORRIGÉE
app.get('/api/elevator', (req, res) => {
    try {
        console.log('📥 [ASCENSEUR] Requête reçue - Query:', req.query);

        const { 
            floor = '-1', 
            action = 'descend', 
            timestamp, 
            user = 'ascenseur_interface', 
            status = 'moving',
            device = 'elevator_panel'
        } = req.query;

        // CORRECTION: Gestion robuste du timestamp
        let receivedTimestamp;
        let timestampValue = timestamp;
        
        if (timestampValue && timestampValue !== '${Date.now()}') {
            // Nettoyer le timestamp
            timestampValue = timestampValue.toString().replace('${Date.now()}', '');
            const ts = parseInt(timestampValue, 10);
            
            if (!isNaN(ts) && ts > 100000000000) { // Vérifier que c'est un timestamp valide (après 1973)
                receivedTimestamp = new Date(ts);
                if (isNaN(receivedTimestamp.getTime())) {
                    console.warn('⚠️ Timestamp converti invalide, utilisation date actuelle');
                    receivedTimestamp = new Date();
                }
            } else {
                console.warn('⚠️ Timestamp invalide ou trop petit:', timestampValue);
                receivedTimestamp = new Date();
            }
        } else {
            // Si pas de timestamp ou placeholder, utiliser maintenant
            console.warn('⚠️ Pas de timestamp valide, utilisation date actuelle');
            receivedTimestamp = new Date();
        }

        // Valider l'étage
        const floorNumber = parseInt(floor, 10);
        if (isNaN(floorNumber)) {
            throw new Error(`Étage invalide: ${floor}`);
        }

        // Log dans la console serveur
        const logData = {
            floor: floorNumber,
            action,
            timestamp: receivedTimestamp.toISOString(),
            user,
            status,
            device,
            ip: req.ip || req.connection.remoteAddress || 'unknown',
            userAgent: req.get('User-Agent') || 'Unknown',
            receivedAt: new Date().toISOString(),
            rawQuery: req.query
        };
        
        console.log('🛗 [ASCENSEUR] Action reçue:', JSON.stringify(logData, null, 2));

        // ICI: Vous pouvez ajouter la logique pour bouger l'ascenseur dans Unreal Engine
        // Exemple: envoyer un WebSocket, sauvegarder en DB, etc.
        
        console.log('🎮 [UNREAL] Instruction envoyée: Déplacer ascenseur vers étage', floorNumber);

        // Réponse JSON
        const response = {
            success: true,
            message: `Ascenseur programmé pour l'étage ${floorNumber}`,
            data: {
                floor: floorNumber,
                action,
                timestamp: receivedTimestamp,
                serverTime: new Date(),
                movement: {
                    targetFloor: floorNumber,
                    status: 'scheduled',
                    estimatedDuration: '3 secondes',
                    instruction: 'MOVE_TO_FLOOR'
                }
            },
            metadata: {
                apiVersion: '1.0.0',
                service: 'NEXA Auth API - Elevator Module',
                processedAt: new Date().toISOString(),
                unrealEngineNotification: true
            }
        };

        console.log('✅ [ASCENSEUR] Réponse envoyée:', JSON.stringify(response, null, 2));
        res.json(response);

    } catch (error) {
        console.error('❌ Erreur dans /api/elevator:', error.message);
        console.error('❌ Stack:', error.stack);
        console.error('❌ Query reçu:', req.query);
        
        res.status(400).json({
            success: false,
            error: 'Données invalides',
            message: error.message,
            receivedQuery: req.query,
            suggestion: 'Utilisez: ?floor=-1&timestamp=1700000000000'
        });
    }
});

// Route POST pour ascenseur (alternative)
app.post('/api/elevator', (req, res) => {
    try {
        console.log('📥 [ASCENSEUR] POST reçu - Body:', req.body);

        const elevatorData = req.body;

        if (!elevatorData) {
            throw new Error('Données manquantes');
        }

        const response = {
            success: true,
            message: 'Données ascenseur reçues',
            data: {
                ...elevatorData,
                serverTime: new Date(),
                processedAt: new Date().toISOString()
            },
            metadata: {
                receivedVia: 'POST',
                unrealEngineReady: true
            }
        };

        console.log('✅ [ASCENSEUR] POST traité:', response);
        res.json(response);

    } catch (error) {
        console.error('❌ Erreur dans POST /api/elevator:', error);
        res.status(400).json({
            success: false,
            error: 'Données invalides',
            message: error.message
        });
    }
});

// Route test simple pour vérifier
app.get('/api/elevator/test', (req, res) => {
    const testResponse = {
        success: true,
        message: 'API Ascenseur fonctionnelle',
        testData: {
            currentTime: new Date().toISOString(),
            timestampExample: Date.now(),
            endpoint: '/api/elevator',
            parameters: {
                required: 'floor',
                optional: 'action, timestamp, user, status'
            }
        },
        exampleUrl: `${req.protocol}://${req.get('host')}/api/elevator?floor=-1&timestamp=${Date.now()}&action=descend`
    };
    
    console.log('🧪 Test endpoint appelé');
    res.json(testResponse);
});

// Route santé
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'NEXA Auth API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        endpoints: {
            auth: '/api/auth',
            widget: '/api/widget',
            users: '/api/users',
            elevator: '/api/elevator',
            elevatorTest: '/api/elevator/test',
            health: '/api/health'
        },
        elevatorStatus: 'operational'
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
            elevator: {
                get: '/api/elevator?floor=-1&timestamp=[timestamp]',
                post: '/api/elevator (JSON body)',
                test: '/api/elevator/test'
            },
            health: '/api/health'
        },
        documentation: 'https://docs.nexa-auth.com',
        version: '1.0.0'
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    console.warn('⚠️ Route non trouvée:', req.method, req.path);
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.path,
        method: req.method,
        availableEndpoints: [
            '/api/auth',
            '/api/widget', 
            '/api/users',
            '/api/elevator',
            '/api/elevator/test',
            '/api/health'
        ]
    });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur global:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        error: 'Erreur interne du serveur',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue',
        timestamp: new Date().toISOString(),
        requestId: Math.random().toString(36).substring(7)
    });
});

// Démarrer le serveur
app.listen(PORT, () => {
    console.log(`
    🚀 Serveur NEXA Auth API démarré
    🌍 Port: ${PORT}
    🔗 URL: http://localhost:${PORT}
    🛗 Route ascenseur: http://localhost:${PORT}/api/elevator
    🧪 Route test: http://localhost:${PORT}/api/elevator/test
    📊 Route santé: http://localhost:${PORT}/api/health
    
    📝 Exemple d'URL ascenseur:
    http://localhost:${PORT}/api/elevator?floor=-1&timestamp=${Date.now()}&action=descend
    `);
});
