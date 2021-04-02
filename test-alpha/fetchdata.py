# ---------------------------------------------------------------------
# fetchdata.py
# Back end: Will return data from PostgreSQL database
# ---------------------------------------------------------------------

from reqlib import ReqLib
from flask import Flask, request, json, make_response, render_template, redirect
import sys
import os

app = Flask(__name__, template_folder='.')

@app.route('/', methods=['GET'])
@app.route('/index', methods=['GET'])
def display_home():
	html = render_template('arcgis.html')
	return make_response(html)

@app.route('/points', methods=['POST'])
def get_data():
	req_lib = ReqLib()
	# if request.method == 'POST':
	categoryID = request.get_json().get('categoryid')
	# elif request.method == 'GET':
	# 	categoryID = int(request.args.get('id'))
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	return data

@app.route('/wkorder', methods=['POST'])
def format_wkorder():
	# # cookies for later NOT WORKING BC RESPONSE NEEDS A TEMPLATE
	# response.set_cookie('firstname', request.form.get('firstname'))
	# response.set_cookie('lastname', request.form.get('lastname'))
	# response.set_cookie('email', request.form.get('email'))
	# response.set_cookie('phone', request.form.get('phone'))
	# response.set_cookie('alt-firstname', request.form.get('alt-firstname'))
	# response.set_cookie('alt-lastname', request.form.get('alt-lastname'))
	# response.set_cookie('alt-email', request.form.get('alt-email'))
	# response.set_cookie('campus', request.form.get('campus'))
	# response.set_cookie('building', request.form.get('building'))
	# response.set_cookie('description', request.form.get('description'))
	# testing
	print(request.form.get('firstname'), request.form.get('lastname'), request.form.get('email'), request.form.get('phone'),
		request.form.get('alt-firstname'), request.form.get('alt-lastname'), request.form.get('alt-email'), request.form.get('alt-phone'), 
		request.form.get('alt-netid'), request.form.get('contacted'), request.form.get('charge-source'), request.form.get('campus'), 
		request.form.get('building'), request.form.get('description'))
	html = render_template('arcgis.html')
	return make_response(html)

# @app.route('/wkorder-final', methods=['POST'])
# def finalize_wkorder():
# 	# access cookie info
# 	print(request.cookies.get('firstname'), request.cookies.get('lastname'), request.cookies.get('email'), request.cookies.get('phone'),
# 		request.cookies.get('alt-firstname'), request.cookies.get('alt-lastname'), request.cookies.get('alt-email'), request.cookies.get('alt-phone'), 
# 		request.cookies.get('alt-netid'), request.cookies.get('contacted'), request.cookies.get('charge-source'), request.cookies.get('campus'), 
# 		request.cookies.get('building'), request.cookies.get('description'))

# NEED TO IMPLEMENT CONCURRENT PROCESSES
def main():
	port = int(os.environ.get("PORT", 5000))
	data = app.run(host='0.0.0.0', port=port, debug=True)
	return data

if __name__ == "__main__":
	data = main()
