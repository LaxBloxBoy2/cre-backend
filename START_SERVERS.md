# QAPT Platform - How to Start the Servers

This document explains how to start both the frontend and backend servers for the QAPT Platform.

## Starting the Servers

You can use the `start_servers.bat` file to start both servers at once, or follow the manual steps below.

### Using the Batch File

1. Double-click on `start_servers.bat` in the root directory
2. This will open two command windows - one for the frontend and one for the backend
3. The frontend will be available at http://localhost:3000
4. The backend will be available at http://localhost:8000

### Manual Steps

#### Starting the Backend Server

1. Open a command prompt
2. Navigate to the backend directory:
   ```
   cd cre_platform_backend
   ```
3. Activate the virtual environment:
   ```
   .\venv\Scripts\activate.ps1
   ```
4. Start the backend server:
   ```
   uvicorn app.main:app --reload
   ```
5. The backend will be available at http://localhost:8000

#### Starting the Frontend Server

1. Open another command prompt
2. Navigate to the root directory of the project
3. Start the frontend server:
   ```
   npm run dev
   ```
4. The frontend will be available at http://localhost:3000

## Database Information

The project uses a PostgreSQL database hosted on Render. The connection details are:

- **Host**: dpg-d03tj6ngi27c738ctia0-a.oregon-postgres.render.com
- **Database**: db_cre
- **Username**: db_cre_user
- **Password**: PqZ0gE88y2V2NmNUDPuj6S4yV0hh2v3a

The database connection string is already configured in the `.env` file in the backend directory.

## Troubleshooting

If you encounter any issues:

1. Make sure both servers are running
2. Check the console output for any error messages
3. Verify that the environment variables are set correctly
4. Try restarting the servers

For login issues, you can use the demo credentials:
- Email: analyst@example.com
- Password: password123
