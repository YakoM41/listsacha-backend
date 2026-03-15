// Importer les dépendances nécessaires
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Importer le Pool de 'pg'

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// --- Connexion à la base de données PostgreSQL ---
// Render fournit une URL de connexion directe que nous utiliserons en production.
const dbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En production sur Render, il est bon d'activer SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// --- Routes de l'API ---

// GET /api/activities - Récupérer toutes les activités
app.get('/api/activities', async (req, res) => {
    try {
        const result = await dbPool.query('SELECT * FROM activities ORDER BY id');
        res.json(result.rows);
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
        // La syntaxe pour les placeholders est $1, $2, etc. en PostgreSQL
        const result = await dbPool.query(
            'INSERT INTO activities (name, day, time) VALUES ($1, $2, $3) RETURNING *',
            [name, day, time]
        );
        res.status(201).json(result.rows[0]); // Renvoyer la ligne complète insérée
    } catch (error) {
        console.error("Erreur lors de l'ajout de l'activité:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// DELETE /api/activities/:id - Supprimer une activité
app.delete('/api/activities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await dbPool.query('DELETE FROM activities WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Activité non trouvée." });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Erreur lors de la suppression de l'activité:", error);
        res.status(500).json({ message: "Erreur serveur." });
    }
});


// --- Démarrage du serveur ---
const startServer = async () => {
    try {
        const client = await dbPool.connect();
        console.log('Connexion à la base de données PostgreSQL réussie.');

        // Créer la table si elle n'existe pas (syntaxe PostgreSQL)
        await client.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                day VARCHAR(50) NOT NULL,
                time VARCHAR(50) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table 'activities' vérifiée/créée avec succès.");
        
        client.release();

        app.listen(PORT, () => {
            console.log('Serveur démarré sur http://localhost:' + PORT);
        });

    } catch (error) {
        console.error('Impossible de se connecter à la base de données ou de démarrer le serveur:', error);
        process.exit(1);
    }
};

startServer();
