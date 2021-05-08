#!/bin/bash
# For local testing. Sets environment variable for our SendGrid API key.

export SENDGRID_API_KEY=$(heroku config:get SENDGRID_API_KEY -a tigertools)