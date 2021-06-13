#!/bin/bash
# might switch to DATABASE_URL=$(heroku config:get DATABASE_URL -a your-app) your_process

# heroku config:get DATABASE_URL -a tigertools

export DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools)
