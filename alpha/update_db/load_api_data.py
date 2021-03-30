# ----------------------------------------------------------
# Loads atheltic facility data into Heroku test database
# ----------------------------------------------------------

# IMPORTANT: EXECUTE . get-db-url.sh IN COMMAND LINE BEFORE RUNNING THIS PYTHON SCRIPT

import os
import psycopg2
# import psutil
# import subprocess

def load_athletics(dbcursor):
	# make athletics table
	dbcursor.execute('DROP TABLE IF EXISTS athletics')
	dbcursor.execute('CREATE TABLE athletics (building VARCHAR(60), sports VARCHAR(60), lat decimal, long decimal, PRIMARY KEY (building))')
	# read csv into athletics table
	# dbcursor.execute("copy athletics(facility, sports, lat, long) FROM '/Users/indup/Documents/TigerTools-test/alpha/athletic_data.csv' DELIMITER ',' CSV HEADER;")
	# https://stackoverflow.com/questions/30050097/copy-data-from-csv-to-postgresql-using-python
	csv_file_name = '/Users/indup/Documents/TigerTools-test/alpha/athletic_data.csv'
	sql = "COPY athletics FROM STDIN CSV HEADER"
	dbcursor.copy_expert(sql, open(csv_file_name, "r"))

	# checking if it worked
	# dbcursor.execute('SELECT * FROM athletics;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()

def load_water(dbcursor):
	dbcursor.execute('DROP TABLE IF EXISTS water')
	dbcursor.execute('CREATE TABLE water (asset integer, description VARCHAR(110), buildingcode VARCHAR(20), building VARCHAR(60),PRIMARY KEY (asset))')
	# dbcursor.execute("copy athletics(facility, sports, lat, long) FROM '/Users/indup/Documents/TigerTools-test/alpha/athletic_data.csv' DELIMITER ',' CSV HEADER;")
	# https://stackoverflow.com/questions/30050097/copy-data-from-csv-to-postgresql-using-python
	csv_file_name = '/Users/indup/Documents/TigerTools-test/alpha/water_data.csv'
	sql = "COPY water FROM STDIN CSV HEADER"
	dbcursor.copy_expert(sql, open(csv_file_name, "r"))
	# checking if it worked
	dbcursor.execute('SELECT * FROM water;')
	row = dbcursor.fetchone()
	for i in range(5):
		print(row)
		row = dbcursor.fetchone()

def main():
	# NEED TO FIGURE OUT HOW TO RUN BASH SCRIPT TO EXPORT VAR FROM PYTHON SCRIPT
	# DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools-test) psutil.Process.name()
	# https://www.kite.com/python/answers/how-to-execute-a-bash-script-in-python
	# https://stackoverflow.com/questions/16618071/can-i-export-a-variable-to-the-environment-from-a-bash-script-without-sourcing-i for .
	# return_code = subprocess.call(['sh', './get-db-url.sh'])
	# os.system("export DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools-test)")
	DATABASE_URL = os.environ['DATABASE_URL']

	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()
	load_athletics(dbcursor)
	dbconnection.commit()
	load_water(dbcursor)
	dbconnection.commit()

	dbcursor.close()
	dbconnection.close()

if __name__ == '__main__':
	main()