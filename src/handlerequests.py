# ---------------------------------------------------------------------
# handlerequests.py
# Handles app routes
# ---------------------------------------------------------------------

from CASClient import CASClient
from reqlib import ReqLib
from flask import Flask, request, make_response, render_template, redirect, url_for
from flask import json, jsonify
from time import gmtime, strftime
import datetime
from datetimerange import DateTimeRange
import arrow
import json
import psycopg2
import sys
import os
import csv
from load_api_data import update, places_open
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

app = Flask(__name__, template_folder='.')

# Generated by os.urandom(16)
app.secret_key = b'c\xb4@S1g\x1d\x90C\xfc\xb7Y\xc5I\xf5\x16'

# ---------------------------------------------------------------------
# https://levelup.gitconnected.com/building-csv-strings-in-python-32934aed5a9e
class CsvTextBuilder(object):
    def __init__(self):
        self.csv_string = []

    def write(self, row):
        self.csv_string.append(row)

# ---------------------------------------------------------------------
@app.route('/')
@app.route('/index')
def landing():
	if CASClient().redirectLanding() == 0:
		return redirect(url_for('display_map'))
	else:
		html = render_template('templates/index.html')
		return make_response(html)

# ---------------------------------------------------------------------
@app.route('/error')
def error_page():
	html = render_template('templates/error.html')
	return make_response(html)

# ---------------------------------------------------------------------
@app.route('/map', methods=['GET'])
def display_map():
	netid = CASClient().authenticate()

	# update database
	update()

	html = render_template('templates/arcgis.html',netid=netid)
	return make_response(html)

# ---------------------------------------------------------------------
def _tuples_to_json(keys, tuples_lists):
	# https://anthonydebarros.com/2020/09/06/generate-json-from-sql-using-python/
	# https://stackoverflow.com/questions/14831830/convert-a-list-of-tuples-to-a-list-of-lists
	lists = [list(t) for t in tuples_lists]
	record_dict = []
	if lists is not None:
		for record in lists:
			one_record = dict(zip(keys, record))
			record_dict.append(one_record)
	return json.dumps(record_dict)

# ---------------------------------------------------------------------
@app.route('/points', methods=['POST'])
def get_data():
	netid = CASClient().authenticate()
	places_open()
	try:
		# get info
		amenity_type = request.get_json().get('amenity_type')
		# connect to database
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		# printers
		if amenity_type == "printers" or amenity_type == "scanners" or amenity_type == "macs":
			# get column names
			# https://stackoverflow.com/questions/10252247/how-do-i-get-a-list-of-column-names-from-a-psycopg2-cursor
			stmt = 'SELECT * FROM id6 LIMIT 0;'
			dbcursor.execute(stmt)
			cols = [desc[0] for desc in dbcursor.description]

		if amenity_type == "printers":
			# get records
			stmt = 'SELECT * FROM id6 WHERE printers<>%s;'
			dbcursor.execute(stmt,('None',))
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "scanners":
			stmt = 'SELECT * FROM id6 WHERE scanners<>%s;'
			dbcursor.execute(stmt,('None',))
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "macs":
			stmt = 'SELECT * FROM id6 WHERE macs<>%s;'
			dbcursor.execute(stmt,('None',))
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "dining":
			# get columns names
			stmt = 'SELECT * FROM dining LIMIT 0;'
			dbcursor.execute(stmt)
			cols = [desc[0] for desc in dbcursor.description]
			cols.append('open')
			# get records
			stmt = 'SELECT dining.*,isitopen.open FROM dining \
				INNER JOIN isitopen ON dining.dbid=isitopen.dbid;'
			dbcursor.execute(stmt)
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "cafes":
			# get columns names
			stmt = 'SELECT * FROM cafes LIMIT 0;'
			dbcursor.execute(stmt)
			cols = [desc[0] for desc in dbcursor.description]
			cols.append('open')
			# get records
			stmt = 'SELECT cafes.*,isitopen.open FROM cafes \
				INNER JOIN isitopen ON cafes.dbid=isitopen.dbid;'
			dbcursor.execute(stmt)
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "vendingmachines":
			# get column names
			stmt = 'SELECT * FROM vendingmachines LIMIT 0;'
			dbcursor.execute(stmt)
			cols = [desc[0] for desc in dbcursor.description]
			# get records
			stmt = 'SELECT * FROM vendingmachines;'
			dbcursor.execute(stmt)
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "athletics":
			# get column names
			stmt = 'SELECT * FROM athletics LIMIT 0;'
			dbcursor.execute(stmt)
			cols = [desc[0] for desc in dbcursor.description]
			# get records
			stmt = 'SELECT * FROM athletics;'
			dbcursor.execute(stmt)
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		elif amenity_type == "water":
			# get column names
			stmt = 'SELECT * FROM water LIMIT 0;'
			dbcursor.execute(stmt)
			cols = [desc[0] for desc in dbcursor.description]
			cols.append('lat')
			cols.append('long')
			# get records
			stmt = 'SELECT water.*, buildings.lat, buildings.long \
				FROM water INNER JOIN buildings ON water.buildingcode LIKE buildings.locationcode;'
			dbcursor.execute(stmt)
			data = dbcursor.fetchall()
			data_json = _tuples_to_json(cols, data)

		dbcursor.close()
		dbconnection.close()
		if data_json == '':
			raise Exception('No data available for this amenity:', amenity_type)
		return data_json
	except Exception as e:
		print(str(e), file=sys.stderr)
		return redirect(url_for('error_page'))

# ---------------------------------------------------------------------
@app.route('/info', methods=['POST'])
def get_info():
	netid = CASClient().authenticate()
	try:
		amenity_type = request.get_json().get('type')

		if amenity_type == "Printer" or amenity_type == "Computer Cluster" or amenity_type == "Scanner":
			html = render_template('templates/info_templates/printers.html',
				description=request.get_json().get("description"),
				accessible=request.get_json().get("accessible"),
				printers=request.get_json().get("printers"),
				scanners=request.get_json().get("scanners"),
				computers=request.get_json().get("computers"))
			return make_response(html)

		elif amenity_type == "Dining hall":
			html = render_template('templates/info_templates/dhalls.html',
				who=request.get_json().get("who"),
				payment=request.get_json().get("payment"),
				open=request.get_json().get("open"),
				capacity=request.get_json().get("capacity"),
				rescollege=request.get_json().get("rescollege"))
			return make_response(html)

		elif amenity_type == "Café":
			html = render_template('templates/info_templates/cafes.html',
				description=request.get_json().get("description"),
				who=request.get_json().get("who"),
				payment=request.get_json().get("payment"),
				open=request.get_json().get("open"))
			return make_response(html)

		elif amenity_type == "Vending Machine":
			html = render_template('templates/info_templates/vending.html',
				directions=request.get_json().get("directions"),
				what=request.get_json().get("what"),
				payment=request.get_json().get("payment"))
			return make_response(html)

		elif amenity_type == "Athletic Facility":
			html = render_template('templates/info_templates/athletics.html',
				sports=request.get_json().get("sports"))
			return make_response(html)

		elif amenity_type == "Bottle-Filling Station":
			html = render_template('templates/info_templates/water.html',
				floor=request.get_json().get("floor"),directions=request.get_json().get("directions"))
			return make_response(html)

	except Exception as e:
		print(str(e), file=sys.stderr)
		return '<h6> Unable to display amenity information. Please try again later. </h6>'

# ---------------------------------------------------------------------
@app.route('/wkorder', methods=['POST'])
def format_wkorder():
	netid = CASClient().authenticate()
	# https://levelup.gitconnected.com/building-csv-strings-in-python-32934aed5a9e
	csvfile = CsvTextBuilder()
	data = [[request.form.get('netid'),request.form.get('firstname'),request.form.get('lastname'),request.form.get('email'),request.form.get('phone'),
		request.form.get('alt-netid'),request.form.get('alt-firstname'),request.form.get('alt-lastname'),request.form.get('alt-email'), \
		request.form.get('alt-phone'),request.form.get('contacted'), \
		 request.form.get('campus'),request.form.get('charge-source'),request.form.get('building'),request.form.get('buildingcode'), \
		 request.form.get('locationcode'),request.form.get('asset'), \
		 request.form.get('description') + ' --- MORE LOCATION INFO: Floor: '+request.form.get('floor')+'; Room: '+ \
		request.form.get('room')]]
	writer = csv.writer(csvfile)
	writer.writerows(data)
	csv_string = csvfile.csv_string
	# testing
	print('Amenity','NetID','First Name','Last Name','E-mail','Phone','Alt NetID','Alt First Name','Alt Last Name','Alt Email','Alt Phone', \
	'Contact for Scheduling','Charge Source','Campus','Building','Building Code','Location Code','Asset','Description (with more location info appended if given by user)')
	print(''.join(csv_string))
	# email
	# https://www.twilio.com/blog/how-to-send-emails-in-python-with-sendgrid
	message = Mail(from_email='tigertoolsprinceton@gmail.com',to_emails='%s@princeton.edu'%netid,subject='Work order test',\
	 	html_content=('<p>%s</p>'%csv_string))
	sg = SendGridAPIClient(os.environ.get('SENDGRID_API_KEY'))
	response = sg.send(message)
	html = render_template('templates/arcgis.html', netid=netid)
	return make_response(html)

# ---------------------------------------------------------------------
@app.route('/comment', methods=['POST'])
def store_comment():
	netid = CASClient().authenticate()
	try:
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		amenity_name = request.get_json().get('amenityName')
		comment_time = strftime("%Y-%m-%d %H:%M:%S", gmtime())
		comment = request.get_json().get('textComment')
		dbcursor.execute('CREATE TABLE IF NOT EXISTS comments (AMENITY_NAME text, COMMENT text, TIME text);')
		query = 'INSERT INTO comments (amenity_name, comment, time) VALUES (%s, %s, %s);'
		data = (amenity_name, comment, comment_time)
		dbcursor.execute(query, data)
		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()
		html = render_template('templates/arcgis.html')
		return make_response(html)

	except Exception as e:
		print(str(e), file=sys.stderr)
		html = render_template('templates/arcgis.html')
		return make_response(html)
	
# ---------------------------------------------------------------------
@app.route('/displaycomments', methods=['POST'])
def show_comments():
	netid = CASClient().authenticate()
	try:
		amenityName = request.get_json().get('amenityName')
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		query = "SELECT * FROM comments WHERE AMENITY_NAME = %s;"
		dbcursor.execute(query, (amenityName,))
		comments = dbcursor.fetchall()
		dbcursor.close()
		dbconnection.close()
		current_time = datetime.datetime.now()
		delta = datetime.timedelta(days = 7)
		a = current_time - delta
		comments_modified = []
		time_range = DateTimeRange(a, current_time)
		for comment in comments:
			if (comment[2] in time_range):
				comments_modified.append([comment[0], comment[1], arrow.get(comment[2]).humanize()])
		comments_modified.reverse()

		html = render_template('templates/displaycomments.html', data=comments_modified, wasSuccessful = True)
		return make_response(html)
	
	except Exception as e:
		print(str(e), file=sys.stderr)
		html = render_template('templates/displaycomments.html', data=[], wasSuccessful = False)
		return make_response(html)
	
# ---------------------------------------------------------------------
@app.route('/displayupvotes', methods=['POST'])
def show_upvotes():
	netid = CASClient().authenticate()
	try:
		amenityName = request.get_json().get('amenityName')
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		dbcursor.execute('CREATE TABLE IF NOT EXISTS votes (amenity_name text, netid text, upvotes INTEGER, downvotes INTEGER);')
		dbconnection.commit()
		query = "SELECT SUM(upvotes) FROM votes WHERE AMENITY_NAME = %s;"
		dbcursor.execute(query, (amenityName,))
		upvotes = dbcursor.fetchall()[0][0]
		if (upvotes == None): upvotes = 0
		dbcursor.execute('SELECT votes.upvotes, votes.downvotes from votes where amenity_name = %s AND netid=%s AND upvotes = 1 AND downvotes = 0', (amenityName, netid,))
		result = dbcursor.fetchone()
		currentlyLiking = True
		if (result == None):
			currentlyLiking = False
		dbcursor.close()
		dbconnection.close()
		html = render_template('templates/displayLikes.html', num_of_likes = upvotes, isLiking = currentlyLiking, wasSuccessful = True)
		return make_response(html)

	except Exception as e:
		print(str(e), file=sys.stderr)
		html = render_template('templates/displayLikes.html', num_of_likes = "Error", wasSuccessful = False, isLiking = False)
		return make_response(html)

# ---------------------------------------------------------------------
@app.route('/displaydownvotes', methods=['POST'])
def show_downvotes():
	netid = CASClient().authenticate()
	try:
		amenityName = request.get_json().get('amenityName')
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		#dbcursor.execute('CREATE TABLE IF NOT EXISTS votes (amenity_name text, netid text, upvotes INTEGER, downvotes INTEGER);')
		#dbconnection.commit()
		query = "SELECT SUM(downvotes) FROM votes WHERE AMENITY_NAME = %s;"
		dbcursor.execute(query, (amenityName,))
		downvotes = dbcursor.fetchall()[0][0]
		if (downvotes == None): downvotes = 0
		dbcursor.execute('SELECT votes.upvotes, votes.downvotes from votes where amenity_name = %s AND netid=%s AND downvotes = 1 AND upvotes = 0', (amenityName, netid,))
		result = dbcursor.fetchone()
		currentlyDisliking = True
		if (result == None):
			currentlyDisliking = False
		dbcursor.close()
		dbconnection.close()
		html = render_template('templates/displayDislikes.html', num_of_dislikes = downvotes, isDisliking = currentlyDisliking ,wasSuccessful = True)
		return make_response(html)

	except Exception as e:
		print(str(e), file=sys.stderr)
		html = render_template('templates/displayDislikes.html', num_of_dislikes = "Error", wasSuccessful = False, isDisliking = False)
		return make_response(html)

# ---------------------------------------------------------------------
@app.route('/placeupvote', methods=['POST'])
def place_upvote():
	netid = CASClient().authenticate()
	try:
		amenityName = request.get_json().get('amenityName')
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		#dbcursor.execute('CREATE TABLE IF NOT EXISTS votes (amenity_name text, netid text, upvotes INTEGER, downvotes INTEGER);')
		dbcursor.execute('SELECT votes.upvotes, votes.downvotes from votes where amenity_name = %s AND netid=%s', (amenityName, netid,))
		result = dbcursor.fetchone()
		if (result == None):
			query = 'INSERT INTO votes (amenity_name, netid, upvotes, downvotes) VALUES (%s, %s, %s, %s);'
			data = (amenityName, netid, 1, 0)
			dbcursor.execute(query, data)

		else:
			if (result[0] == 1):
				dbcursor.execute('UPDATE votes set upvotes = 0, downvotes = 0 where amenity_name = %s AND netid=%s', (amenityName, netid,))
			else:
				dbcursor.execute('UPDATE votes set upvotes = 1, downvotes = 0 where amenity_name = %s AND netid=%s', (amenityName, netid,))

		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()

		html = render_template('templates/arcgis.html')
		return make_response(html)

	except Exception as e:
		print(str(e), file=sys.stderr)
		html = render_template('templates/arcgis.html')
		return make_response(html)

#---------------------------------------------------------------------
@app.route('/placedownvote', methods=['POST'])
def place_downvote():
	netid = CASClient().authenticate()

	try:
		amenityName = request.get_json().get('amenityName')
		DATABASE_URL = os.environ['DATABASE_URL']
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		#dbcursor.execute('CREATE TABLE IF NOT EXISTS votes (amenity_name text, netid text, upvotes INTEGER, downvotes INTEGER);')
		dbcursor.execute('SELECT votes.upvotes, votes.downvotes from votes where amenity_name = %s AND netid=%s', (amenityName, netid,))
		result = dbcursor.fetchone()
		if (result == None):
			query = 'INSERT INTO votes (amenity_name, netid, upvotes, downvotes) VALUES (%s, %s, %s, %s);'
			data = (amenityName, netid, 0, 1)
			dbcursor.execute(query, data)

		else:
			if (result[1] == 1):
				dbcursor.execute('UPDATE votes set upvotes = 0, downvotes = 0 where amenity_name = %s AND netid=%s', (amenityName, netid,))
			else:
				dbcursor.execute('UPDATE votes set upvotes = 0, downvotes = 1 where amenity_name = %s AND netid=%s', (amenityName, netid,))

		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()

		html = render_template('templates/arcgis.html')
		return make_response(html)

	except Exception as e:
		print(str(e), file=sys.stderr)
		html = render_template('templates/arcgis.html')
		return make_response(html)

#-----------------------------------------------------------------------
@app.route('/logout', methods=['GET'])
def logout():
    casClient = CASClient()
    casClient.authenticate()
    casClient.logout()

#-----------------------------------------------------------------------
@app.errorhandler(404)
def page_not_found(e):
    return render_template('templates/404.html'), 404

@app.errorhandler(500)
def internal_server_error(e):
    return render_template('templates/error.html'), 500