import sys
import os

# Include backend directory in python path for Vercel Serverless Function resolution
backend_dir = os.path.join(os.path.dirname(__file__), '..', 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app

# Export ASGI app for Vercel
__all__ = ["app"]
