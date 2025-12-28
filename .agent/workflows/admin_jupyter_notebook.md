---
description: Workflow pour utiliser le Notebook Jupyter d'Administration
---

# Workflow : Administration ML via Jupyter Notebook

Ce workflow décrit comment l'administrateur peut utiliser Jupyter Notebook pour gérer, réentraîner et visualiser le modèle de Machine Learning.

## Prérequis

Assurez-vous que Python et les dépendances sont installés.
Le fichier `requirements.txt` dans `ml_service` contient les paquets nécessaires.

```bash
pip install -r ml_service/requirements.txt
pip install jupyter
```

## Étapes

1.  **Ouvrir le Notebook**
    Naviguez vers le dossier `ml_service` et lancez Jupyter Notebook.

    ```bash
    .\start_notebook.bat
    ```
    
    Ou manuellement :
    ```bash
    cd ml_service
    jupyter notebook --NotebookApp.token='' --NotebookApp.password=''
    ```

    Cela ouvrira une page web. Cliquez sur `admin_dashboard.ipynb` pour l'ouvrir.

2.  **Exécuter les Cellules**
    Le notebook est divisé en sections :
    *   **Chargement des Données** : Récupère les données depuis MongoDB.
    *   **Entraînement** : Entraîne le modèle Random Forest.
    *   **Visualisation** : Affiche la matrice de confusion et les scores.
    *   **Sauvegarde** : Enregistre le modèle sous `model.pkl`.

    Vous pouvez exécuter toutes les cellules via le menu "Cell" > "Run All".

3.  **Analyser les Résultats**
    Regardez la matrice de confusion générée à l'étape 3.
    *   **Diagonale (haut-gauche, bas-droite)** : Bonnes prédictions.
    *   **Autres cases** : Erreurs.

4.  **Mise à jour du site**
    Une fois le modèle sauvegardé (étape 4), le serveur backend utilisera automatiquement le nouveau modèle pour les prochaines requêtes.

## Dépannage

*   Si `jupyter` n'est pas reconnu, assurez-vous qu'il est installé et ajouté au PATH.
*   Si la connexion MongoDB échoue, vérifiez que votre base de données tourne. Le notebook passera automatiquement en mode "Données factices" si la DB n'est pas accessible.
