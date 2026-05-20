import os
from pathlib import Path

from app import create_app
from app.config import Config

static = os.environ.get("STATIC_FOLDER")
if static:
    Config.STATIC_FOLDER = Path(static)

app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)
