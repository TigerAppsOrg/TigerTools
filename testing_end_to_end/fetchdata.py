# ---------------------------------------------------------------------
# fetchdata.py
# Back end: Deals with javascript requests
# ---------------------------------------------------------------------

from reqlib import ReqLib
from flask import Flask, request, json
import sys

app = Flask(__name__, template_folder='.')

@app.route('/', methods=['POST'])
def get_dhall_data():
	req_lib = ReqLib()
	categoryID = request.get_json().get('categoryid')
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	return data