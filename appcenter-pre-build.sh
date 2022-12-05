#!/usr/bin/env bash

# add required app center environment variables into a .env file for use with react-native-config
echo GRAPH_URI=$GRAPH_URI >> .env
echo WALLET_REST_URI=$WALLET_REST_URI >> .env
echo ONE_SIGNAL_APP_ID=$ONE_SIGNAL_APP_ID >> .env
echo ONE_SIGNAL_ACCOUNT_TAG_SALT=$ONE_SIGNAL_ACCOUNT_TAG_SALT >> .env
echo SENTRY_DSN=$SENTRY_DSN >> .env
echo WALLET_CONNECT_PROJECT_ID=$WALLET_CONNECT_PROJECT_ID >> .env
echo WALLET_CONNECT_METADATA_URL=$WALLET_CONNECT_METADATA_URL >> .env
echo HELIUS_API_KEY=$HELIUS_API_KEY >> .env
echo HELIUS_API_URL=$HELIUS_API_URL >> .env


