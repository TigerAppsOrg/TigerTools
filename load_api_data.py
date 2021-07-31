# ---------------------------------------------------------------------
# load_api_data.py
# Updates Heroku database with OIT MobileApp API data
# ---------------------------------------------------------------------

import os
import psycopg2
from reqlib import ReqLib
import json
import sys

# ---------------------------------------------------------------------
'''
Consumes /dining/locations/ endpoint in OIT's MobileApp API based on
categoryid number. Returns a Python dictionary.
'''
def _consume_mobileapp(categoryid):
	req_lib = ReqLib()
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryid,)
	data_dict = json.loads(data)
	return data_dict.get('locations').get('location')

# ---------------------------------------------------------------------
'''
Retrieves category ID 2 data from /dining/locations/ endpoint in 
MobileApp API and loads data into the "dining" table after clearing the 
existing records. Prints log message to stderr if an error occurs.
'''
def dining_halls():
	try:
		categoryID = 2
		DATABASE_URL = os.environ['DATABASE_URL']

		# retrieve data from OIT
		data_dict = _consume_mobileapp(categoryID)
		if data_dict is None:
			raise Exception("No data retrieved")

		# clear entries in database table
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		dbcursor.execute('CREATE TABLE IF NOT EXISTS dining (name VARCHAR(100), \
			dbid VARCHAR(4), buildingname VARCHAR(100), locationcode VARCHAR(4), lat VARCHAR(10), \
			long VARCHAR(10), rescollege VARCHAR(30), who VARCHAR(120), payment VARCHAR(500), \
			capacity VARCHAR(6), PRIMARY KEY(name, dbid));')
		dbcursor.execute('DELETE FROM dining;')
		dbconnection.commit()

		# extract data from dictionaries
		for i in range(len(data_dict)):
			rescollege = 'None'
			who = 'None'
			payment = 'None'
			capacity = 'None'
			row = data_dict[i]
			amenities_list = row.get('amenities').get('amenity')
			if(amenities_list is None):
				amenities_list = []
			if isinstance(amenities_list,dict):
				temp = amenities_list
				amenities_list = [temp]
			for j in range(len(amenities_list)):
				a = amenities_list[j].get('name')
				a = a.split(': ')
				if a.count('College') != 0:
					rescollege = a[1]
				if a.count('Open to') != 0:
					who = a[1]
				if a.count('Payment') != 0:
					payment = a[1]
				if a.count('Capacity') != 0:
					capacity = a[1]
			
			# insert record into "dining"
			stmt = 'INSERT INTO \
				dining (name, dbid, buildingname, locationcode, lat, long, rescollege, who, payment, capacity) \
				VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);'
			info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),\
				row.get('building').get('location_id'), row.get('geoloc').get('lat'),\
				row.get('geoloc').get('long'),rescollege,who,payment,capacity)
			dbcursor.execute(stmt, info)
			dbconnection.commit()
		
		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()
	except Exception as e:
		print('Database error: something went wrong with dining_halls()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ---------------------------------------------------------------------
'''
Retrieves category ID 3 data from /dining/locations/ endpoint in 
MobileApp API and loads data into the "cafes" table after clearing the 
existing records. Prints log message to stderr if an error occurs.
'''
def cafes():
	try:
		categoryID = 3
		DATABASE_URL = os.environ['DATABASE_URL']

		# retrieve data from OIT
		data_dict = _consume_mobileapp(categoryID)

		# clear entries in database table
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		dbcursor.execute('CREATE TABLE IF NOT EXISTS cafes (name VARCHAR(100), dbid VARCHAR(4), \
			buildingname VARCHAR(100), locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), \
			description VARCHAR(1000), who VARCHAR(120), payment VARCHAR(500), PRIMARY KEY(name, dbid));')
		dbcursor.execute('DELETE FROM cafes;')
		dbconnection.commit()

		# extract data from dictionaries
		for i in range(len(data_dict)):
			who = ''
			payment = 'None'
			descrip = 'None'
			row = data_dict[i]
			descrip = row.get('description')
			if(row.get('description') is None):
				descrip = 'None'
			amenities_list = row.get('amenities').get('amenity')
			if(amenities_list is None):
				amenities_list = []
			if isinstance(amenities_list,dict):
				temp = amenities_list
				amenities_list = [temp]
			for j in range(len(amenities_list)):
				a = amenities_list[j].get('name')
				a = a.split(': ')
				if a.count('Open to') != 0:
					who += a[1]
				if a.count('Payment') != 0:
					payment = a[1]
			if who == '':
				who = 'None'
			
			# insert record into "cafes"
			stmt = 'INSERT INTO \
				cafes (name, dbid, buildingname, locationcode, lat, long, description, who, payment) \
				VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);'
			info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),\
				row.get('building').get('location_id'), row.get('geoloc').get('lat'),\
				row.get('geoloc').get('long'),descrip,who,payment)
			dbcursor.execute(stmt, info)
			dbconnection.commit()
		
		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()
	except Exception as e:
		print('Database error: something went wrong with cafes()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ---------------------------------------------------------------------
'''
Retrieves category ID 4 data from /dining/locations/ endpoint in 
MobileApp API and loads data into the "vendingmachines" table after 
clearing the existing records. 
Prints log message to stderr if an error occurs.
'''
def vending_machines():
	try:
		categoryID = 4
		DATABASE_URL = os.environ['DATABASE_URL']

		# retrieve data from OIT
		data_dict = _consume_mobileapp(categoryID)

		# clear entries in database table
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		dbcursor.execute('CREATE TABLE IF NOT EXISTS vendingmachines (name VARCHAR(100), dbid VARCHAR(4), \
			buildingname VARCHAR(100), locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), \
			directions VARCHAR(1000), what VARCHAR(500), payment VARCHAR(500), PRIMARY KEY(name, dbid));')
		dbcursor.execute('DELETE FROM vendingmachines;')
		dbconnection.commit()

		# extract data from dictionaries
		for i in range(len(data_dict)):
			what = 'None'
			payment = 'None'
			descrip = 'None'
			row = data_dict[i]
			descrip = row.get('description')
			if(descrip is None):
				descrip = 'None'
			# more directions if exists in OIT name field
			name_info = row.get('name')
			name_info = name_info.split(' - ')
			if len(name_info) > 1:
				directions = name_info[1]
				if descrip == 'None':
					descrip = directions
				else:
					descrip += ', ' + directions
			amenities_list = row.get('amenities').get('amenity')
			if(amenities_list is None):
				amenities_list = []
			if isinstance(amenities_list,dict):
				temp = amenities_list
				amenities_list = [temp]
			for j in range(len(amenities_list)):
				a = amenities_list[j].get('name')
				a = a.split(': ')
				if a.count('Type') != 0:
					what = a[1]
				if a.count('Payment') != 0:
					payment = a[1]
			
			# insert record into "vendingmachines"
			stmt = 'INSERT INTO \
				vendingmachines (name, dbid, buildingname, locationcode, lat, long, directions, what, payment) \
				VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);'
			info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),\
				row.get('building').get('location_id'), row.get('geoloc').get('lat'),\
				row.get('geoloc').get('long'),descrip,what,payment)
			dbcursor.execute(stmt, info)
			dbconnection.commit()

		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()
	except Exception as e:
		print('Database error: something went wrong with vending_machines()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ---------------------------------------------------------------------
'''
Retrieves category ID 6 data from /dining/locations/ endpoint in 
MobileApp API and loads data into the "id6" table after clearing the 
existing records. Prints log message to stderr if an error occurs.
'''
def categoryid6():
	try:
		categoryID = 6
		DATABASE_URL = os.environ['DATABASE_URL']
		
		# retrieve data from OIT
		data_dict = _consume_mobileapp(categoryID)
		if data_dict is None:
			raise Exception("No data retrieved")

		# clear entries in database table
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		dbcursor.execute('CREATE TABLE IF NOT EXISTS id6 (name VARCHAR(100), dbid VARCHAR(4), \
			buildingname VARCHAR(100),locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), \
			accessible VARCHAR(30), description VARCHAR(80), printers VARCHAR(4), macs VARCHAR(4), \
			scanners VARCHAR(4), room VARCHAR(10), floor VARCHAR(10), locationmore VARCHAR(30), \
			PRIMARY KEY(name, dbid));')
		dbcursor.execute('DELETE FROM id6;')
		dbconnection.commit()

		# extract data from dictionaries
		for i in range(len(data_dict)):
			accessible = 'None'
			printers = 'None'
			macs = 'None'
			scanners = 'None'
			descrip = 'None'
			room = 'None'
			floor = 'None'
			locationmore = 'None'
			row = data_dict[i]
			descrip = row.get('description')
			if(row.get('description') is None):
				descrip = 'None'
			# more location info if exists in OIT name field
			name_info = row.get('name')
			name_info = name_info.split(' - ')
			if len(name_info) > 1:
				locationmore = name_info[1]
				more_loc = locationmore.split(' ')
				if more_loc.count('Room') != 0:
					room = more_loc[more_loc.index('Room')+1]
				if more_loc.count('Floor') != 0:
					floor = more_loc[more_loc.index('Floor')-1]
				if more_loc.count('Level') != 0:
					floor = more_loc[more_loc.index('Level')-1]
			amenities_list = row.get('amenities').get('amenity')
			if(amenities_list is None):
				amenities_list = []
			if isinstance(amenities_list,dict):
				temp = amenities_list
				amenities_list = [temp]
			for j in range(len(amenities_list)):
				a = amenities_list[j].get('name')
				a = a.split(': ')
				if a.count('Accessible') != 0:
					accessible = a[1]
				if a.count('Printers') != 0:
					printers = a[1]
				if a.count('Macs') != 0:
					macs = a[1]
				if a.count('Scanners') != 0:
					scanners = a[1]
			
			# insert record into "id6"
			stmt = 'INSERT INTO \
				id6 (name, dbid, buildingname, locationcode, lat, long, accessible, \
				description, printers, macs, scanners, room, floor, locationmore) \
				VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);'
			info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),\
				row.get('building').get('location_id'), row.get('geoloc').get('lat'),\
				row.get('geoloc').get('long'),accessible,descrip,printers,macs,scanners,room,floor,locationmore)
			dbcursor.execute(stmt, info)
			dbconnection.commit()

		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()
	except Exception as e:
		print('Database error: something went wrong with categoryid6()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ---------------------------------------------------------------------
'''
Retrieves data from /places/open/ endpoint in MobileApp API and loads 
data into the "isitopen" table after clearing the existing records. 
Prints log message to stderr if an error occurs.
'''
def places_open():
	try:
		DATABASE_URL = os.environ['DATABASE_URL']

		# retrieve data from /places/open/
		req_lib = ReqLib()
		data = req_lib.getJSON(req_lib.configs.PLACES_OPEN,)

		# clear entries in database table
		dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
		dbcursor = dbconnection.cursor()
		dbcursor.execute('CREATE TABLE IF NOT EXISTS isitopen (name VARCHAR (100), \
			dbid VARCHAR(4), open VARCHAR(4), PRIMARY KEY(name, dbid));')
		dbcursor.execute('DELETE FROM isitopen;')
		dbconnection.commit()

		# insert records into "isitopen"
		for i in range(len(data)):
			row = data[i]
			stmt = 'INSERT INTO isitopen (name, dbid, open) VALUES (%s, %s, %s);'
			info = (row.get('name'),row.get('id'),row.get('open'))
			dbcursor.execute(stmt, info)
			dbconnection.commit()

		dbconnection.commit()
		dbcursor.close()
		dbconnection.close()
	except Exception as e:
		print('Database error: something went wrong with places_open()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ---------------------------------------------------------------------
def update():
	categoryid6()
	# dining_halls()
	# cafes()
	# vending_machines()
	# places_open()

