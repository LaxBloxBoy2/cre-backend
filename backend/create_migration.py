import os
import sys
import subprocess

def create_initial_migration():
    """Create the initial migration for the database schema."""
    try:
        # Create migrations directory if it doesn't exist
        os.makedirs('migrations/versions', exist_ok=True)
        
        # Run alembic revision with autogenerate
        subprocess.run([
            'alembic', 'revision', '--autogenerate', 
            '-m', 'Initial migration for rent roll schema'
        ], check=True)
        
        print("Initial migration created successfully!")
    except subprocess.CalledProcessError as e:
        print(f"Error creating migration: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_initial_migration()
