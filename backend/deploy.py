import os
import sys
import subprocess
import argparse

def run_migrations():
    """Run database migrations."""
    try:
        print("Running database migrations...")
        subprocess.run(['alembic', 'upgrade', 'head'], check=True)
        print("Migrations completed successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error running migrations: {e}")
        sys.exit(1)

def import_sample_data():
    """Import sample data into the database."""
    try:
        print("Importing sample data...")
        subprocess.run(['python', 'import_data.py'], check=True)
        print("Sample data imported successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error importing sample data: {e}")
        sys.exit(1)

def start_server(port=8001):
    """Start the FastAPI server."""
    try:
        print(f"Starting server on port {port}...")
        subprocess.run([
            'uvicorn', 'rent_roll_main:app', 
            '--host', '0.0.0.0', 
            '--port', str(port),
            '--reload'
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("Server stopped.")

def deploy():
    """Deploy the application."""
    parser = argparse.ArgumentParser(description='Deploy the rent roll backend.')
    parser.add_argument('--migrate', action='store_true', help='Run database migrations')
    parser.add_argument('--import-data', action='store_true', help='Import sample data')
    parser.add_argument('--start', action='store_true', help='Start the server')
    parser.add_argument('--port', type=int, default=8001, help='Port to run the server on')
    parser.add_argument('--all', action='store_true', help='Run migrations, import data, and start the server')
    
    args = parser.parse_args()
    
    if args.all or args.migrate:
        run_migrations()
    
    if args.all or args.import_data:
        import_sample_data()
    
    if args.all or args.start:
        start_server(args.port)

if __name__ == "__main__":
    deploy()
