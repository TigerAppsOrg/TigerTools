# ---------------------------------------------------------------------
# readdata.py
# Back end: Connects to OIT APIs
# ---------------------------------------------------------------------

#!/usr/bin/env python3
import requests
import json
from configs import Configs
import xmltodict


class ReqLib:

	def __init__(self):
		self.configs = Configs()

	'''
	This function allows a user to make a request to 
	a certain endpoint, with the BASE_URL of 
	https://api.princeton.edu:443/mobile-app
	The parameters kwargs are keyword arguments. It
	symbolizes a variable number of arguments 
	'''
	def getJSON(self, endpoint, **kwargs):
		req = requests.get(self.configs.BASE_URL + endpoint, 
			params=kwargs if "kwargs" not in kwargs else kwargs["kwargs"], 
			headers={"Authorization": "Bearer " + self.configs.ACCESS_TOKEN},)
		text = req.text

		# Check to see if the response failed due to invalid
		# credentials
		text = self._updateConfigs(text, endpoint, **kwargs)

		return json.loads(text)

	def _updateConfigs(self, text, endpoint, **kwargs):
		if text.startswith("<ams:fault"):
			self.configs._refreshToken(grant_type="client_credentials")

		# Redo the request with the new access token
			req = requests.get(self.configs.BASE_URL + endpoint, 
				params=kwargs if "kwargs" not in kwargs else kwargs["kwargs"], 
				headers={"Authorization": "Bearer " + self.configs.ACCESS_TOKEN},)
			text = req.text

		return text

	def getXMLorTXT(self, endpoint, **kwargs):
		req = requests.get(self.configs.BASE_URL + endpoint, 
			params=kwargs if "kwargs" not in kwargs else kwargs["kwargs"], 
			headers={"Authorization": "Bearer " + self.configs.ACCESS_TOKEN},)
		# Check to see if the response failed due to invalid
		# credentials
		text = self._updateConfigs(req.text, endpoint, **kwargs)
		return text

	def getJSONfromXML(self, endpoint, **kwargs):
		req = requests.get(self.configs.BASE_URL + endpoint, 
			params=kwargs if "kwargs" not in kwargs else kwargs["kwargs"], 
			headers={"Authorization": "Bearer " + self.configs.ACCESS_TOKEN},)
		# https://www.geeksforgeeks.org/python-xml-to-json/
		# https://stackoverflow.com/questions/2148119/how-to-convert-an-xml-string-to-a-dictionary
		text = self._updateConfigs(req.text, endpoint, **kwargs)
		data_dict = xmltodict.parse(text)
		json_data = json.dumps(data_dict)
		return json_data

