"""
Vercel entrypoint for the FastAPI service.

Vercel looks for a supported Python web app entry file. This module keeps the
existing application code in `main.py` and simply re-exports the FastAPI app.
"""

from app.main import app
