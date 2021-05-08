# ----------------------------------------------------------
# load_csv_data.py
# Loads data from CSV data sources into Heroku database
# ----------------------------------------------------------

'''
Please note the CSV files have been removed from src.
IMPORTANT: EXECUTE . get-db-url.sh IN COMMAND LINE AND CHANGE 
FILE PATHWAYS IF NEEDED BEFORE RUNNING THIS PYTHON SCRIPT
'''

import os
import psycopg2
import sys

# ----------------------------------------------------------
'''
Loads data from athletic_data.csv into the "athletics" table.
Prints log message to stderr if error occurs.
'''
def load_athletics(dbcursor):
	try:
		# make athletics table
		dbcursor.execute('DROP TABLE IF EXISTS athletics')
		dbcursor.execute('CREATE TABLE athletics (buildingname VARCHAR(80), \
			sports VARCHAR(60), lat VARCHAR(15), long VARCHAR(15), PRIMARY KEY (buildingname))')
		# load csv into athletics table
		csv_file_name = '/Users/indup/Documents/TigerTools/src/update_csv/athletic_data.csv'
		sql = "COPY athletics FROM STDIN DELIMITER ',' CSV HEADER"
		dbcursor.copy_expert(sql, open(csv_file_name, "r"))
	except Exception as e:
		print('Database error: something went wrong with load_athletics()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ----------------------------------------------------------
'''
Loads data from water_data.csv into the "water" table.
Prints log message to stderr if error occurs.
'''
def load_water(dbcursor):
	try:
		# make water table
		dbcursor.execute('DROP TABLE IF EXISTS water')
		dbcursor.execute('CREATE TABLE water (asset VARCHAR(6), description VARCHAR(110), \
			buildingcode VARCHAR(20), buildingname VARCHAR(80), floor VARCHAR(80), \
			directions VARCHAR(80),PRIMARY KEY (asset))')
		# load csv
		csv_file_name = '/Users/indup/Documents/TigerTools/src/update_csv/water_data.csv'
		sql = "COPY water FROM STDIN CSV HEADER"
		dbcursor.copy_expert(sql, open(csv_file_name, "r"))
	except Exception as e:
		print('Database error: something went wrong with load_water()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ----------------------------------------------------------
'''
Loads data from buildings.csv into the "buildings" table.
Prints log message to stderr if error occurs.
'''
def load_buildings(dbcursor):
	try:
		# make buildings table
		dbcursor.execute('DROP TABLE IF EXISTS buildings')
		dbcursor.execute('CREATE TABLE buildings (locationcode VARCHAR(6), \
			buildingname VARCHAR(110), lat VARCHAR(20), long VARCHAR(20), \
			PRIMARY KEY (locationcode))')
		# load csv
		csv_file_name = '/Users/indup/Documents/TigerTools/src/update_csv/buildings.csv'
		sql = "COPY buildings FROM STDIN CSV HEADER"
		dbcursor.copy_expert(sql, open(csv_file_name, "r"))
	except Exception as e:
		print('Database error: something went wrong with load_buildings()', file=sys.stderr)
		print(str(e), file=sys.stderr)

# ----------------------------------------------------------
'''
Calls functions to load CSV data into the corresponding 
database tables.
'''
def main():
	DATABASE_URL = os.environ.get('DATABASE_URL', None)

	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()
	load_athletics(dbcursor)
	dbconnection.commit()
	load_water(dbcursor)
	dbconnection.commit()
	load_buildings(dbcursor)
	dbconnection.commit()

	dbcursor.close()
	dbconnection.close()

# ----------------------------------------------------------
if __name__ == '__main__':
	main()