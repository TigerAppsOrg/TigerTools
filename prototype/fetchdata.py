# ---------------------------------------------------------------------
# fetchdata.py
# Back end: Will return data from PostgreSQL database
# ---------------------------------------------------------------------

from reqlib import ReqLib
from flask import Flask, request, json, make_response, render_template
import sys

app = Flask(__name__, template_folder='.')

@app.route('/', methods=['GET'])
def display_home():
	html = render_template('arcgis.html')
	return make_response(html)

@app.route('/points', methods=['POST'])
def get_dhall_data():
	req_lib = ReqLib()
	# if request.method == 'POST':
	categoryID = request.get_json().get('categoryid')
	# elif request.method == 'GET':
	# 	categoryID = int(request.args.get('id'))
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	return data
