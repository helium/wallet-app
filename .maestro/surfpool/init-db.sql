-- Empty stand-ins for the indexer tables that a blockchain-api migration
-- reads (the hotspot_ownership_v0 view). In production the account sink
-- fills them. The Maestro fixture wallet owns no hotspots, so they stay empty.
CREATE TABLE asset_owners (asset TEXT PRIMARY KEY, owner TEXT);
CREATE TABLE key_to_assets (
  asset TEXT,
  entity_key BYTEA,
  encoded_entity_key TEXT,
  key_serialization JSONB
);
CREATE TABLE recipients (asset TEXT, lazy_distributor TEXT, destination TEXT);
CREATE TABLE rewards_recipients (
  asset TEXT,
  owner TEXT,
  destination TEXT,
  entity_key BYTEA,
  encoded_entity_key TEXT,
  key_serialization JSONB,
  shares NUMERIC,
  total_shares NUMERIC,
  fixed_amount NUMERIC,
  type TEXT
);
