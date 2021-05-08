#!/bin/bash
# For local testing. Sets an environment variable containing our database URL for Heroku.

export DATABASE_URL=$(heroku config:get DATABASE_URL -a tigertools)
