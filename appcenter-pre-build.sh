#!/usr/bin/env bash

# add required app center environment variables into a .env file for use with react-native-config
echo GRAPH_URI=$GRAPH_URI >> .env
echo ONE_SIGNAL_APP_ID=$ONE_SIGNAL_APP_ID >> .env
echo ONE_SIGNAL_ACCOUNT_TAG_SALT=$ONE_SIGNAL_ACCOUNT_TAG_SALT >> .env
