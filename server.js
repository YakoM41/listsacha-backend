// Importer les dépendances nécessaires
require('dotenv').config(); // Pour charger les variables d'environnement du fichier .env
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Autoriser les requêtes cross-origin (entre le frontend et le backend)
app.use(express.json()); // Permettre au serveur de comprendre le JSON envoyé par le client

// --- Connexion à la base de données ---
// Utilise les informations du fichier .env
const dbPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// --- Routes de l'API ---

// GET /api/activities - Récupérer toutes les activités
app.get('/api/activities', async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT * FROM activities ORDER BY id');
        res.json(rows);
    } catch (error) {
        console.error("Erreur lors de la récupération des activités:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// POST /api/activities - Ajouter une nouvelle activité
app.post('/api/activities', async (req, res) => {
    const { name, day, time } = req.body;

    if (!name || !day || !time) {
        return res.status(400).json({ message: "Les champs 'name', 'day' et 'time' sont requis." });
    }

    try {
        const [result] = await dbPool.query(
            'INSERT INTO activities (name, day, time) VALUES (?, ?, ?)',
            [name, day, time]
        );
        // Renvoyer le nouvel objet avec son ID
        res.status(201).json({
            id: result.insertId,
            name,
            day,
            time
        });
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'activité:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// DELETE /api/activities/:id - Supprimer une activité
app.delete('/api/activities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await dbPool.query('DELETE FROM activities WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Activité non trouvée." });
        }
        res.status(204).send(); // 204 No Content = Succès, sans rien renvoyer
    } catch (error) {
        console.error("Erreur lors de la suppression de l'activité:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


// --- Démarrage du serveur ---
const startServer = async () => {
    try {
        // Vérifier la connexion à la BDD
        const connection = await dbPool.getConnection();
        console.log('Connexion à la base de données MySQL réussie.');

        // Créer la table si elle n'existe pas
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                day VARCHAR(50) NOT NULL,
                time VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'activities' vérifiée/créée avec succès.");
        
        connection.release();

        // Démarrer le serveur Express
        app.listen(PORT, () => {
            console.log('Serveur démarré sur http://localhost:' + PORT);
        });

    } catch (error) {
        console.error('Impossible de se connecter à la base de données ou de démarrer le serveur:', error);
        process.exit(1); // Arrêter l'application en cas d'erreur critique
    }
};

startServer();
