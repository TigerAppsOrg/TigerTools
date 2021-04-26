# ---------------------------------------------------------------------
# runlocal.py
# This script is for running the TigerTools application locally.
# Access using localhost:port. 0.0.0.0 is not authorized to use CAS.
# ---------------------------------------------------------------------

'''
	IMPORTANT: EXECUTE . get-db-url.sh AND . get-email-key.sh IN COMMAND 
	LINE BEFORE RUNNING THIS PYTHON SCRIPT LOCALLY
'''

from flask import Flask, request
import sys
import os
from handlerequests import app

def main():
	port = int(os.environ.get("PORT", 5000))
	app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
	data = main()