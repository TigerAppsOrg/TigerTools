#!/bin/bash

export SENDGRID_API_KEY=$(heroku config:get SENDGRID_API_KEY -a tigertools-prod)