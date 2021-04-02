# ---------------------------------------------------------------------
# runlocal.py
# This script is for running the app locally
# ---------------------------------------------------------------------

from flask import Flask, request
import sys

def main():
	port = int(os.environ.get("PORT", 5000))
	data = app.run(host='0.0.0.0', port=port, debug=True)
	return data

if __name__ == "__main__":
	data = main()