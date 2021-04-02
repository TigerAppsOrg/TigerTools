# ----------------------------------------------------------
# load_api_data.py
# Updates Heroku database with MobileApp API data
# ----------------------------------------------------------

# IMPORTANT: EXECUTE . get-db-url.sh IN COMMAND LINE BEFORE RUNNING THIS PYTHON SCRIPT

import os
import psycopg2
from reqlib import ReqLib
# import psutil
# import subprocess

def printers(dbcursor):
	# make table
	dbcursor.execute('DROP TABLE IF EXISTS printers')
	dbcursor.execute('CREATE TABLE printers (name VARCHAR(100), dbid integer, maploc integer, long decimal, PRIMARY KEY (building))')
	
	csv_file_name = '/Users/indup/Documents/TigerTools-test/alpha/athletic_data.csv'
	sql = "COPY athletics FROM STDIN CSV HEADER"
	dbcursor.copy_expert(sql, open(csv_file_name, "r"))

	# checking if it worked
	# dbcursor.execute('SELECT * FROM athletics;')
	# row = dbcursor.fetchone()
	# while row is not None:
	# 	print(row)
	# 	row = dbcursor.fetchone()
	# checking if it worked
	# dbcursor.execute('SELECT * FROM water;')
	# row = dbcursor.fetchone()
	# for i in range(5):
	# 	print(row)
	# 	row = dbcursor.fetchone()

def main():
	# DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools-test) psutil.Process.name()
	# https://www.kite.com/python/answers/how-to-execute-a-bash-script-in-python
	# https://stackoverflow.com/questions/16618071/can-i-export-a-variable-to-the-environment-from-a-bash-script-without-sourcing-i for .
	# return_code = subprocess.call(['sh', './get-db-url.sh'])
	# os.system("export DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools-test)")
	DATABASE_URL = os.environ.get('DATABASE_URL', None)

	dbconnection = psycopg2.connect(DATABASE_URL, sslmode='require')
	dbcursor = dbconnection.cursor()
	printers(dbcursor)
	dbconnection.commit()
	dbconnection.commit()

	dbcursor.close()
	dbconnection.close()

if __name__ == '__main__':
	main()