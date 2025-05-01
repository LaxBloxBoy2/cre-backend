import sys
import os

# Print Python version
print(f"Python version: {sys.version}")

# Check if the cre_platform_backend directory exists
print(f"cre_platform_backend exists: {os.path.exists('cre_platform_backend')}")

# Try to import the main module
try:
    sys.path.append('cre_platform_backend')
    import main
    print("Successfully imported main module")
except Exception as e:
    print(f"Error importing main module: {e}")

# Print the current working directory
print(f"Current working directory: {os.getcwd()}")

# List files in the cre_platform_backend directory
if os.path.exists('cre_platform_backend'):
    print("Files in cre_platform_backend:")
    for file in os.listdir('cre_platform_backend'):
        print(f"  {file}")
