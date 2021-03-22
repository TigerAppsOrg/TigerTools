# ---------------------------------------------------------------------
# readdatamain.py
# Back end: Reads from OIT APIs
# ---------------------------------------------------------------------

#!/usr/bin/env python3
from readdata import ReqLib

'''
This route does not return data back in a JSON
format, rather it returns in an XML format. Therefore,
if you wish to access this data in JSON form, you will
need to do some manual parsing.
This route returns dining locations along with 
its latitude/longitude information, payment options,
building name, etc.
some categories:
2: dining halls
3: cafes
4: vending machines
6: shows amenities of each hall on campus. 
   Printers, Mac clusters, scanners, and wheelchair
   accessibility.
Please explore the rest of the category ids in order to see
which ones may fit your application needs.
Parameter: categoryID
'''
if __name__ == "__main__":
	req_lib = ReqLib()
	categoryID = 2 # tried dhall locations
	locations = req_lib.getJSONfromXML(req_lib.configs.DINING_LOCATIONS, categoryID=categoryID,)
	print(locations) # this was just to test
