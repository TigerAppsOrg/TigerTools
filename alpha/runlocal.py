# ---------------------------------------------------------------------
# runlocal.py
# This script is for running the app locally
# ---------------------------------------------------------------------

from flask import Flask, request
import sys
import os
from handlerequests import app

def main():
	port = int(os.environ.get("PORT", 5000))
	app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
	data = main()