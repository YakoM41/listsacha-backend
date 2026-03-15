document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('activity-form');
    const schedule = document.getElementById('schedule');
    // Utiliser une URL relative. Le navigateur saura qu'il doit appeler l'API sur le même domaine.
    const apiUrl = '/api/activities';

    // Charger les activités depuis le serveur au démarrage
    loadActivitiesFromServer();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const activityName = document.getElementById('activity-name').value;
        const activityDay = document.getElementById('activity-day').value;
        const activityTime = document.getElementById('activity-time').value;

        if (activityName) {
            const newActivity = {
                name: activityName,
                day: activityDay,
                time: activityTime
            };
            // Envoyer la nouvelle activité au serveur
            await addActivityToServer(newActivity);
            form.reset();
        }
    });

    // Affiche une activité dans le tableau HTML
    function displayActivity(activity) {
        const { id, name, day, time } = activity;
        const dayRow = schedule.querySelector(`tr[data-day="${day}"]`);
        if (dayRow) {
            const timeCell = dayRow.querySelector(`td.${time}`);
            if (timeCell) {
                const activityElement = document.createElement('div');
                activityElement.classList.add('activity');
                activityElement.dataset.id = id; // Stocker l'ID de la BDD sur l'élément
                activityElement.innerHTML = `
                    <span>${name}</span>
                    <button class="delete-btn">Supprimer</button>
                `;

                // Gérer la suppression
                activityElement.querySelector('.delete-btn').addEventListener('click', async () => {
                    await deleteActivityFromServer(id);
                    activityElement.remove();
                });

                timeCell.appendChild(activityElement);
            }
        }
    }

    // --- Fonctions de communication avec le serveur ---

    // 1. Charger toutes les activités
    async function loadActivitiesFromServer() {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Erreur lors du chargement');
            const activities = await response.json();
            // Vider le tableau avant de le remplir
            document.querySelectorAll('td .activity').forEach(el => el.remove());
            activities.forEach(activity => displayActivity(activity));
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de charger les activités depuis le serveur.');
        }
    }

    // 2. Ajouter une activité
    async function addActivityToServer(activity) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(activity),
            });
            if (!response.ok) throw new Error('Erreur lors de l\'ajout');
            const newActivityWithId = await response.json();
            // Afficher la nouvelle activité dans le tableau
            displayActivity(newActivityWithId);
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible d\'ajouter l\'activité.');
        }
    }

    // 3. Supprimer une activité
    async function deleteActivityFromServer(id) {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Erreur lors de la suppression');
            // La suppression visuelle est déjà gérée dans le listener du bouton
        } catch (error) {
            console.error('Erreur:', error);
            alert('Impossible de supprimer l\'activité.');
        }
    }
});