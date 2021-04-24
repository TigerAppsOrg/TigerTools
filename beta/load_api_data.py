# ---------------------------------------------------------------------
# load_api_data.py
# Updates Heroku database with MobileApp API data
# ---------------------------------------------------------------------

import os
import psycopg2
from reqlib import ReqLib
import json
# import psutil
# import subprocess

# ---------------------------------------------------------------------
def dining_halls():
	DATABASE_URL = os.environ['DATABASE_URL']
	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()

	categoryID = 2
	# make table
	dbcursor.execute('CREATE TABLE IF NOT EXISTS dining (name VARCHAR(100), dbid VARCHAR(4), buildingname VARCHAR(100),\
		locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), rescollege VARCHAR(30), who VARCHAR(120), \
		payment VARCHAR(500), capacity VARCHAR(6), open VARCHAR(4), PRIMARY KEY(name, dbid));')
	dbcursor.execute('DELETE FROM dining;')
	dbconnection.commit()

	req_lib = ReqLib()
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	
	data_dict = json.loads(data)
	data_dict = data_dict.get('locations').get('location')

	for i in range(len(data_dict)):
		rescollege = 'None'
		who = 'None'
		payment = 'None'
		capacity = 'None'
		row = data_dict[i]
		# print("name is", row.get('name'))
		amenities_list = row.get('amenities').get('amenity')
		if(amenities_list is None):
			amenities_list = []
		if isinstance(amenities_list,dict):
			temp = amenities_list
			amenities_list = [temp]
		# print("amenities are", amenities_list)
		for j in range(len(amenities_list)):
			a = amenities_list[j].get('name')
			# a = "Printers: 1: Scanners: 2: Macs: 3"
			a = a.split(': ')
			if a.count('College') != 0:
				rescollege = a[1]
			if a.count('Open to') != 0:
				who = a[1]
			if a.count('Payment') != 0:
				payment = a[1]
			if a.count('Capacity') != 0:
				capacity = a[1]
		stmt = 'INSERT INTO \
			dining (name, dbid, buildingname, locationcode, lat, long, rescollege, who, payment, capacity) \
			VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);'
		info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),row.get('building').get('location_id'), \
				row.get('geoloc').get('lat'),row.get('geoloc').get('long'),rescollege,who,payment,capacity)
		dbcursor.execute(stmt, info)
		dbconnection.commit()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM id6;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()
	dbconnection.commit()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM dininghalls;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row, "\n")
	# 	row = dbcursor.fetchone()

	dbcursor.close()
	dbconnection.close()

# ---------------------------------------------------------------------
def cafes():
	DATABASE_URL = os.environ['DATABASE_URL']
	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()

	categoryID = 3
	# make table
	dbcursor.execute('CREATE TABLE IF NOT EXISTS cafes (name VARCHAR(100), dbid VARCHAR(4), buildingname VARCHAR(100),\
		locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), description VARCHAR(1000), who VARCHAR(120), \
		payment VARCHAR(500), open VARCHAR(4), PRIMARY KEY(name, dbid));')
	dbcursor.execute('DELETE FROM cafes;')
	dbconnection.commit()
	# , PRIMARY KEY (dbid)

	req_lib = ReqLib()
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	
	data_dict = json.loads(data)
	data_dict = data_dict.get('locations').get('location')

	for i in range(len(data_dict)):
		who = ''
		payment = 'None'
		descrip = 'None'
		row = data_dict[i]
		# print("name is", row.get('name'))
		descrip = row.get('description')
		if(row.get('description') is None):
			descrip = 'None'
		# amenities_list = row.get('amenities').get('amenity')
		amenities_list = row.get('amenities').get('amenity')
		if(amenities_list is None):
			amenities_list = []
		if isinstance(amenities_list,dict):
			temp = amenities_list
			amenities_list = [temp]
		# print("amenities are", amenities_list)
		for j in range(len(amenities_list)):
			a = amenities_list[j].get('name')
			# a = "Printers: 1: Scanners: 2: Macs: 3"
			a = a.split(': ')
			if a.count('Open to') != 0:
				who += a[1]
			if a.count('Payment') != 0:
				payment = a[1]
		if who == '':
			who = 'None'
		stmt = 'INSERT INTO \
			cafes (name, dbid, buildingname, locationcode, lat, long, description, who, payment) \
			VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);'
		info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),row.get('building').get('location_id'), \
				row.get('geoloc').get('lat'),row.get('geoloc').get('long'),descrip,who,payment)
		dbcursor.execute(stmt, info)
		dbconnection.commit()
	dbconnection.commit()

	# checking if it worked
	# dbcursor.execute('SELECT * FROM id6;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM cafes;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row, "\n")
	# 	row = dbcursor.fetchone()

	dbcursor.close()
	dbconnection.close()

# ---------------------------------------------------------------------
def vending_machines():
	DATABASE_URL = os.environ['DATABASE_URL']
	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()

	categoryID = 4
	# make table
	dbcursor.execute('CREATE TABLE IF NOT EXISTS vendingmachines (name VARCHAR(100), dbid VARCHAR(4), buildingname VARCHAR(100),\
		locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), description VARCHAR(1000), what VARCHAR(500), \
		payment VARCHAR(500), PRIMARY KEY(name, dbid));')
	dbcursor.execute('DELETE FROM vendingmachines;')
	dbconnection.commit()

	req_lib = ReqLib()
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	
	data_dict = json.loads(data)
	data_dict = data_dict.get('locations').get('location')

	for i in range(len(data_dict)):
		what = 'None'
		payment = 'None'
		descrip = 'None'
		row = data_dict[i]
		# print("name is", row.get('name'))
		descrip = row.get('description')
		if(descrip is None):
			descrip = 'None'
		# more directions if there
		name_info = row.get('name')
		name_info = name_info.split(' - ')
		if len(name_info) > 1:
			directions = name_info[1]
			if descrip == 'None':
				descrip = directions
			else:
				descrip += ', ' + directions
		# amenities_list = row.get('amenities').get('amenity')
		amenities_list = row.get('amenities').get('amenity')
		if(amenities_list is None):
			amenities_list = []
		if isinstance(amenities_list,dict):
			temp = amenities_list
			amenities_list = [temp]
		# print("amenities are", amenities_list)
		for j in range(len(amenities_list)):
			a = amenities_list[j].get('name')
			# a = "Printers: 1: Scanners: 2: Macs: 3"
			a = a.split(': ')
			if a.count('Type') != 0:
				what = a[1]
			if a.count('Payment') != 0:
				payment = a[1]
		stmt = 'INSERT INTO \
			vendingmachines (name, dbid, buildingname, locationcode, lat, long, description, what, payment) \
			VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);'
		info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),row.get('building').get('location_id'), \
				row.get('geoloc').get('lat'),row.get('geoloc').get('long'),descrip,what,payment)
		dbcursor.execute(stmt, info)
		dbconnection.commit()
	dbconnection.commit()

	# checking if it worked
	# dbcursor.execute('SELECT * FROM id6;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM cafes;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row, "\n")
	# 	row = dbcursor.fetchone()

	dbcursor.close()
	dbconnection.close()

# ---------------------------------------------------------------------
def categoryid6():
	DATABASE_URL = os.environ['DATABASE_URL']
	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()

	categoryID = 6
	# make table
	dbcursor.execute('CREATE TABLE IF NOT EXISTS id6 (name VARCHAR(100), dbid VARCHAR(4), buildingname VARCHAR(100),\
		locationcode VARCHAR(4), lat VARCHAR(10), long VARCHAR(10), accessible VARCHAR(30), description VARCHAR(80), \
		printers VARCHAR(4), macs VARCHAR(4), scanners VARCHAR(4), room VARCHAR(10), floor VARCHAR(10), \
		locationmore VARCHAR(30), PRIMARY KEY(name, dbid));')
	dbcursor.execute('DELETE FROM id6;')
	dbconnection.commit()

	req_lib = ReqLib()
	data = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	
	data_dict = json.loads(data)
	data_dict = data_dict.get('locations').get('location')

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
		# print("name is", row.get('name'))
		descrip = row.get('description')
		if(row.get('description') is None):
			descrip = 'None'
		# extract more location info
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
		# amenities_list = row.get('amenities').get('amenity')
		amenities_list = row.get('amenities').get('amenity')
		if(amenities_list is None):
			amenities_list = []
		if isinstance(amenities_list,dict):
			temp = amenities_list
			amenities_list = [temp]
		# print("amenities are", amenities_list)
		for j in range(len(amenities_list)):
			a = amenities_list[j].get('name')
			# a = "Printers: 1: Scanners: 2: Macs: 3"
			a = a.split(': ')
			if a.count('Accessible') != 0:
				accessible = a[1]
			if a.count('Printers') != 0:
				printers = a[1]
			if a.count('Macs') != 0:
				macs = a[1]
			if a.count('Scanners') != 0:
				scanners = a[1]
		stmt = 'INSERT INTO \
			id6 (name, dbid, buildingname, locationcode, lat, long, accessible, description, printers, macs, scanners, room, floor, locationmore) \
			VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);'
		info = (row.get('name'),row.get('dbid'),row.get('building').get('name'),row.get('building').get('location_id'), \
				row.get('geoloc').get('lat'),row.get('geoloc').get('long'),accessible,descrip,printers,macs,scanners,room,floor,locationmore)
		dbcursor.execute(stmt, info)
		dbconnection.commit()
	dbconnection.commit()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM id6;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM id6;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row, "\n")
	# 	row = dbcursor.fetchone()

	dbcursor.close()
	dbconnection.close()

# ---------------------------------------------------------------------
def places_open():
	DATABASE_URL = os.environ['DATABASE_URL']
	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()

	req_lib = ReqLib()
	data = req_lib.getJSON(req_lib.configs.PLACES_OPEN,)

	dbcursor.execute('CREATE TABLE IF NOT EXISTS isitopen (name VARCHAR (100), dbid VARCHAR(4), open VARCHAR(4), \
		PRIMARY KEY(name, dbid));')
	dbcursor.execute('DELETE FROM isitopen;')
	dbconnection.commit()

	for i in range(len(data)):
		row = data[i]
		stmt = 'INSERT INTO isitopen (name, dbid, open) VALUES (%s, %s, %s);'
		info = (row.get('name'),row.get('id'),row.get('open'))
		dbcursor.execute(stmt, info)
		dbconnection.commit()

	# update status of dining and cafes
	dbcursor.execute('UPDATE dining SET open=isitopen.open FROM isitopen WHERE dining.dbid=isitopen.dbid;')
	dbcursor.execute('UPDATE cafes SET open=isitopen.open FROM isitopen WHERE cafes.dbid=isitopen.dbid;')

	dbconnection.commit()
	dbcursor.close()
	dbconnection.close()

# ---------------------------------------------------------------------
def update():
	categoryid6()
	dining_halls()
	cafes()
	vending_machines()
	places_open()

# def main():
	# DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools-test) psutil.Process.name()
	# https://www.kite.com/python/answers/how-to-execute-a-bash-script-in-python
	# https://stackoverflow.com/questions/16618071/can-i-export-a-variable-to-the-environment-from-a-bash-script-without-sourcing-i for .
	# return_code = subprocess.call(['sh', './get-db-url.sh'])
	# os.system("export DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools-test)")
# 	places_open()

# if __name__ == '__main__':
# 	main()
