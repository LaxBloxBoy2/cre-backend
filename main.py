from src.main import app as application

# This is the main entry point for the application
app = application

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
