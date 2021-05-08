#!/usr/bin/env python3
# ---------------------------------------------------------------------
# reqlib.py
# Back end: Connects to OIT APIs
# adapted from https://github.com/vr2amesh/COS333-API-Code-Examples/
# blob/master/MobileApp/python/req_lib.py
# ---------------------------------------------------------------------

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

	'''
	Convers XML data from API endpoint into JSON output.
	'''
	def getJSONfromXML(self, endpoint, **kwargs):
		req = requests.get(self.configs.BASE_URL + endpoint, 
			params=kwargs if "kwargs" not in kwargs else kwargs["kwargs"], 
			headers={"Authorization": "Bearer " + self.configs.ACCESS_TOKEN},)
		text = self._updateConfigs(req.text, endpoint, **kwargs)
		data_dict = xmltodict.parse(text)
		json_data = json.dumps(data_dict)
		return json_data

