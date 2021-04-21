#!/bin/bash
# might switch to DATABASE_URL=$(heroku config:get DATABASE_URL -a your-app) your_process

# heroku config:get DATABASE_URL -a tigertools

export DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools)
export SENDGRID_API_KEY=$(heroku config:get SENDGRID_API_KEY -a tigertools)