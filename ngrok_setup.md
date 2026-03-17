## Nouveau : Lancement Simplifié (Windows)

J'ai créé un fichier `start_windows.bat` qui lance automatiquement le Backend et le Frontend.

1. Double-cliquez sur `start_windows.bat`.
2. Le Backend démarre sur le port 8000.
3. Le Frontend démarre sur le port 5173.

## Configuration Ngrok (Une seule URL)

Grâce au proxy configuré, vous n'avez besoin que d'**UN SEUL** tunnel ngrok pointant vers Vite (5173).

1. Lancez ngrok sur le port 5173 :
   ```bash
   ngrok http 5173
   ```
2. Partagez l'URL ngrok générée. Tout fonctionnera (API + Site) via ce lien unique.

> [!TIP]
> Dans `src/api/index.ts`, j'ai réglé `API_BASE` sur `"/api"`. Cela permet au Frontend de parler au Backend via le tunnel ngrok de Vite.
