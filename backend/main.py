import sys
import os

# Add the backend directory to sys.path so app packages can be imported normally
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.main import app
