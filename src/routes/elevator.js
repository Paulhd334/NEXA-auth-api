// routes/elevator.js
const express = require('express');
const router = express.Router();

// Route GET pour l'ascenseur (Web Brother URL changed)
router.get('/elevator', (req, res) => {
    try {
        const { 
            floor = '-1', 
            action = 'descend', 
            timestamp, 
            user = 'ascenseur_interface', 
            status = 'moving',
            device = 'elevator_panel'
        } = req.query;

        // Valider et convertir le timestamp
        let receivedTimestamp;
        if (timestamp) {
            const ts = parseInt(timestamp, 10);
            if (isNaN(ts)) {
                throw new Error('Timestamp invalide');
            }
            receivedTimestamp = new Date(ts);
            if (receivedTimestamp.toString() === 'Invalid Date') {
                throw new Error('Date invalide');
            }
        } else {
            receivedTimestamp = new Date();
        }

        const floorNumber = parseInt(floor, 10);
        if (isNaN(floorNumber)) {
            throw new Error('Étage invalide');
        }

        console.log('🛗 [ASCENSEUR] Action reçue:', {
            floor: floorNumber,
            action,
            timestamp: receivedTimestamp.toISOString(),
            user,
            status,
            device,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent') || 'Unknown',
            receivedAt: new Date().toISOString()
        });

        // Réponse JSON
        res.json({
            success: true,
            message: 'Action ascenseur enregistrée',
            data: {
                floor: floorNumber,
                action,
                timestamp: receivedTimestamp,
                serverTime: new Date(),
                nextAction: 'processing',
                estimatedTime: '5s'
            },
            metadata: {
                apiVersion: '1.0.0',
                service: 'NEXA Elevator API',
                processedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('❌ Erreur dans /api/elevator:', error);
        res.status(400).json({
            success: false,
            error: 'Données invalides',
            message: error.message,
            receivedData: req.query
        });
    }
});

// Route POST pour l'ascenseur (alternative)
router.post('/elevator', (req, res) => {
    try {
        const elevatorData = req.body;

        // Validation basique
        if (!elevatorData || typeof elevatorData !== 'object') {
            throw new Error('Données manquantes');
        }

        console.log('🛗 [ASCENSEUR] Données POST reçues:', {
            ...elevatorData,
            ip: req.ip || req.connection.remoteAddress,
            receivedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Données ascenseur reçues',
            data: elevatorData,
            serverTime: new Date(),
            processedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Erreur dans POST /api/elevator:', error);
        res.status(400).json({
            success: false,
            error: 'Données invalides',
            message: error.message
        });
    }
});

// Route pour l'état de l'ascenseur
router.get('/elevator/status', (req, res) => {
    res.json({
        success: true,
        data: {
            currentFloor: -1,
            status: 'active',
            lastAction: 'descend',
            lastUpdate: new Date().toISOString(),
            availableFloors: [-1],
            blockedFloors: [-5, -3, -2],
            apiStatus: 'operational',
            uptime: process.uptime()
        },
        metadata: {
            serverTime: new Date().toISOString(),
            version: '1.0.0'
        }
    });
});

// Route de test simple
router.get('/elevator/test', (req, res) => {
    const testData = {
        floor: -1,
        action: 'test',
        timestamp: Date.now(),
        user: 'tester',
        status: 'test'
    };
    
    console.log('🛗 [ASCENSEUR] Test:', testData);
    
    res.json({
        success: true,
        message: 'Test réussi',
        data: testData,
        serverTime: new Date().toISOString()
    });
});

module.exports = router;
