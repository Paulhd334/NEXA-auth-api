// routes/elevator.js
const express = require('express');
const router = express.Router();

// Route GET pour l'ascenseur (Web Brother URL changed)
router.get('/elevator', (req, res) => {
    const { 
        floor = -1, 
        action = 'descend', 
        timestamp, 
        user = 'ascenseur_interface', 
        status = 'moving',
        device = 'elevator_panel'
    } = req.query;

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

    // Ici vous pouvez:
    // 1. Sauvegarder en base de données
    // 2. Émettre un événement WebSocket vers Unreal Engine
    // 3. Envoyer une notification

    // Pour l'instant, réponse simple
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
            service: 'NEXA Elevator API'
        }
    });
});

// Route POST pour l'ascenseur (alternative)
router.post('/elevator', (req, res) => {
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
            blockedFloors: [-5, -3, -2]
        }
    });
});

module.exports = router;