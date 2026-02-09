# Vercel Setup Instructions

1.  **Import Project**:
    *   Go to your Vercel Dashboard.
    *   Click **"Add New..."** -> **"Project"**.
    *   Import the repository: `tobyStone/tobyStoneWebsite`.

2.  **Configure Project**:
    *   **Framework Preset**: Select **Vite** (or ensure it's auto-detected).
    *   **Root Directory**: `./`

3.  **Build & Output Settings**:
    *   **Build Command**: `bun run build`
    *   **Output Directory**: `dist`
    *   **Install Command**: `bun install`

4.  **Environment Variables**:
    *   Go to the **"Environment Variables"** section.
    *   Add the following variable:
        *   **Key**: `databasePassword`
        *   **Value**: *[Your MongoDB Password]* (e.g., the password for user `tstone4`)
    *   Add any other necessary variables (e.g., `MONGODB_URI` if you prefer to keep the whole string secret, but for this plan we are constructing it in code using the password var).

5.  **Deploy**:
    *   Click **"Deploy"**.

## Bun Configuration
Ensure your `vercel.json` (which will be created in the repo) contains:
```json
{
  "installCommand": "bun install",
  "buildCommand": "bun run build",
  "outputDirectory": "dist"
}
```
This tells Vercel to explicitly use Bun for installation and building.
