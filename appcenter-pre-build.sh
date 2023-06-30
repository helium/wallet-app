#!/usr/bin/env bash

# add required app center environment variables into a .env file for use with react-native-config
echo GRAPH_URI=$GRAPH_URI >> .env
echo WALLET_REST_URI=$WALLET_REST_URI >> .env
echo ONE_SIGNAL_APP_ID=$ONE_SIGNAL_APP_ID >> .env
echo ONE_SIGNAL_ACCOUNT_TAG_SALT=$ONE_SIGNAL_ACCOUNT_TAG_SALT >> .env
echo SENTRY_DSN=$SENTRY_DSN >> .env
echo WALLET_CONNECT_PROJECT_ID=$WALLET_CONNECT_PROJECT_ID >> .env
echo WALLET_CONNECT_METADATA_URL=$WALLET_CONNECT_METADATA_URL >> .env
echo MAINNET_RPC_URL=$MAINNET_RPC_URL >> .env
echo DEVNET_RPC_URL=$DEVNET_RPC_URL >> .env
echo SOLANA_PREVIEW=$SOLANA_PREVIEW >> .env
echo ONBOARDING_API_URL=$ONBOARDING_API_URL >> .env
echo ONBOARDING_SERVER_AUTH=$ONBOARDING_SERVER_AUTH >> .env
echo MIGRATION_SERVER_URL=$MIGRATION_SERVER_URL >> .env
echo RPC_SESSION_KEY_FALLBACK=$RPC_SESSION_KEY_FALLBACK >> .env
echo HNT_TO_RENT_SERVICE_URL=$HNT_TO_RENT_SERVICE_URL >> .env
echo HNT_TO_RENT_SERVICE_DEVNET_URL=$HNT_TO_RENT_SERVICE_DEVNET_URL >> .env
echo MAPBOX_ACCESS_TOKEN=$MAPBOX_ACCESS_TOKEN >> .env
echo MAPBOX_DOWNLOAD_TOKEN=$MAPBOX_DOWNLOAD_TOKEN >> .env
echo MAPBOX_STYLE_URL=$MAPBOX_STYLE_URL >> .env

# generate credential for mapbox
echo machine api.mapbox.com > ~/.netrc
echo login mapbox >> ~/.netrc
echo password $MAPBOX_DOWNLOAD_TOKEN >> ~/.netrc
chmod 0600 ~/.netrc
