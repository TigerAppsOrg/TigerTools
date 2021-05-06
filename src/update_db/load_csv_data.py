# ----------------------------------------------------------
# Loads data from csv data sources into Heroku database
# ----------------------------------------------------------

# IMPORTANT: EXECUTE . get-db-url.sh IN COMMAND LINE AND CHANGE 
# FILE PATHWAYS BEFORE RUNNING THIS PYTHON SCRIPT

import os
import psycopg2

# ----------------------------------------------------------
def load_athletics(dbcursor):
	# make athletics table
	dbcursor.execute('DROP TABLE IF EXISTS athletics')
	dbcursor.execute('CREATE TABLE athletics (buildingname VARCHAR(80), sports VARCHAR(60), lat VARCHAR(15), long VARCHAR(15), PRIMARY KEY (buildingname))')
	# read csv into athletics table
	# https://stackoverflow.com/questions/30050097/copy-data-from-csv-to-postgresql-using-python
	csv_file_name = '/Users/indup/Documents/TigerTools/src/update_db/athletic_data.csv'
	sql = "COPY athletics FROM STDIN DELIMITER ',' CSV HEADER"
	dbcursor.copy_expert(sql, open(csv_file_name, "r"))

	# checking if it worked
	# dbcursor.execute('SELECT * FROM athletics;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()

# ----------------------------------------------------------
def load_water(dbcursor):
	dbcursor.execute('DROP TABLE IF EXISTS water')
	dbcursor.execute('CREATE TABLE water (asset VARCHAR(6), description VARCHAR(110), buildingcode VARCHAR(20), buildingname VARCHAR(80), floor VARCHAR(80), directions VARCHAR(80),PRIMARY KEY (asset))')
	# https://stackoverflow.com/questions/30050097/copy-data-from-csv-to-postgresql-using-python
	csv_file_name = '/Users/indup/Documents/TigerTools/src/update_db/water_data.csv'
	sql = "COPY water FROM STDIN CSV HEADER"
	dbcursor.copy_expert(sql, open(csv_file_name, "r"))
	# checking if it worked
	# dbcursor.execute('SELECT * FROM water;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row)
	# 	row = dbcursor.fetchone()

# ----------------------------------------------------------
def load_buildings(dbcursor):
	dbcursor.execute('DROP TABLE IF EXISTS buildings')
	dbcursor.execute('CREATE TABLE buildings (locationcode VARCHAR(6), buildingname VARCHAR(110), lat VARCHAR(20), long VARCHAR(20), PRIMARY KEY (locationcode))')
	# dbcursor.execute('UPDATE buildings SET locationcode=CONCAT(locationcode,\'%\');')
	csv_file_name = '/Users/indup/Documents/TigerTools/src/update_db/buildings.csv'
	sql = "COPY buildings FROM STDIN CSV HEADER"
	dbcursor.copy_expert(sql, open(csv_file_name, "r"))
	# checking if it worked
	# dbcursor.execute('SELECT * FROM buildings;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row)
	# 	row = dbcursor.fetchone()

# ----------------------------------------------------------
def main():
	# https://stackoverflow.com/questions/16618071/can-i-export-a-variable-to-the-environment-from-a-bash-script-without-sourcing-i for .
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