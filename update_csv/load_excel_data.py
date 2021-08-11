# ----------------------------------------------------------
# load_excel_data.py
# Loads data from Excel data sources into Heroku database
# ----------------------------------------------------------

'''
IMPORTANT: EXECUTE . get-db-url.sh IN COMMAND LINE AND CHANGE 
FILE PATHWAYS IF NEEDED BEFORE RUNNING THIS PYTHON SCRIPT
'''

import os
import psycopg2
import sys
import pandas as pd

# ----------------------------------------------------------
'''
Loads data from TigerTools_DataCollection.xlsx into the "id6" table.
Prints log message to stderr if error occurs.
'''
def load_tech(dbcursor):
	try:
		# load csv into athletics table
		workbook = pd.read_excel('/Users/indup/Documents/TigerTools/current_version/update_csv/TigerTools_DataCollection.xlsx', sheet_name="Amenities")
		workbook['locationcode'] = workbook['locationcode'].astype(str)
		workbook['locationcode'] = workbook['locationcode'].apply(lambda x: x.zfill(4))
		workbook['lat'] = workbook['lat'].astype(str)
		workbook['long'] = workbook['long'].astype(str)
		workbook['room'] = workbook['room'].astype(str)
		workbook['floor'] = workbook['floor'].astype(str)
		workbook['printers'] = workbook['printers'].astype(str)
		workbook['scanners'] = workbook['scanners'].astype(str)
		workbook['macs'] = workbook['macs'].astype(str)
		workbook['buildingname'] = workbook['buildingname'].astype(str)

		for i, row in workbook.iterrows():
			stmt = 'INSERT INTO \
				id6 (locationcode, buildingname, printers, scanners, macs, room, floor, description, lat, long, accessible) \
				VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);'
			info = tuple(row.tolist())
			dbcursor.execute(stmt, info)
		
	except Exception as e:
		print('Database error: something went wrong with load_tech()', file=sys.stderr)
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
	dbcursor.execute('CREATE TABLE IF NOT EXISTS id6 (locationcode VARCHAR(6), buildingname VARCHAR(200), \
		lat VARCHAR(30), long VARCHAR(30), accessible VARCHAR(30), description VARCHAR(80), printers VARCHAR(4),\
		macs VARCHAR(4), scanners VARCHAR(4), room VARCHAR(100), floor VARCHAR(100));')
	dbconnection.commit()
	load_tech(dbcursor)
	dbconnection.commit()

	dbcursor.close()
	dbconnection.close()

# ----------------------------------------------------------
if __name__ == '__main__':
	main()