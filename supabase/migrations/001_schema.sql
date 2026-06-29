-- Enable pg_trgm for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. Agents table (provider & consumer profiles)
CREATE TABLE agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  description   TEXT,
  avatar_url    TEXT,
  website_url   TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agents_slug ON agents(slug);
CREATE INDEX idx_agents_user ON agents(user_id);

-- 2. API Keys (for agent-to-agent auth)
CREATE TABLE api_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID REFERENCES agents(id) ON DELETE CASCADE,
  key_hash      TEXT NOT NULL,
  key_prefix    TEXT NOT NULL,
  name          TEXT NOT NULL,
  permissions   JSONB DEFAULT '["discover", "use"]',
  last_used_at  TIMESTAMPTZ,
  expires_at    TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_keys_agent ON api_keys(agent_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- 3. Capabilities (MCP tool/resource/prompt registrations)
CREATE TABLE capabilities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  tags            TEXT[] DEFAULT '{}',
  
  -- MCP Schema
  mcp_type        TEXT NOT NULL CHECK (mcp_type IN ('tool', 'resource', 'prompt')),
  mcp_schema      JSONB NOT NULL,
  
  -- Endpoint info
  endpoint_url    TEXT NOT NULL,
  endpoint_auth   TEXT DEFAULT 'api_key' CHECK (endpoint_auth IN ('none', 'api_key', 'oauth')),
  
  -- Pricing (in platform credits)
  price_per_call  INTEGER,
  free_tier_limit INTEGER DEFAULT 0,
  
  is_active       BOOLEAN DEFAULT true,
  version         TEXT DEFAULT '1.0.0',
  
  total_calls     INTEGER DEFAULT 0,
  avg_rating      NUMERIC(3,2) DEFAULT 0,
  review_count    INTEGER DEFAULT 0,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_capabilities_agent ON capabilities(agent_id);
CREATE INDEX idx_capabilities_category ON capabilities(category);
CREATE INDEX idx_capabilities_active ON capabilities(is_active);
CREATE INDEX idx_capabilities_search 
  ON capabilities USING GIN(to_tsvector('english', name || ' ' || description));
CREATE INDEX idx_capabilities_trigram 
  ON capabilities USING GIN (name gin_trgm_ops);

-- 4. Transactions (usage records)
CREATE TABLE transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
  provider_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
  capability_id   UUID REFERENCES capabilities(id) ON DELETE SET NULL,
  
  status          TEXT NOT NULL DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  units           INTEGER DEFAULT 1,
  credits_spent   INTEGER DEFAULT 0,
  
  request_hash    TEXT,
  response_hash   TEXT,
  
  latency_ms      INTEGER,
  error_message   TEXT,
  
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_tx_consumer ON transactions(consumer_id);
CREATE INDEX idx_tx_provider ON transactions(provider_id);
CREATE INDEX idx_tx_capability ON transactions(capability_id);
CREATE INDEX idx_tx_created ON transactions(created_at);

-- 5. Reviews
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id   UUID REFERENCES capabilities(id) ON DELETE CASCADE,
  reviewer_id     UUID REFERENCES agents(id) ON DELETE SET NULL,
  
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title           TEXT,
  content         TEXT,
  transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  is_verified     BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reviews_capability ON reviews(capability_id);
CREATE UNIQUE INDEX idx_reviews_unique_tx ON reviews(transaction_id) WHERE transaction_id IS NOT NULL;

-- 6. Credit Balances
CREATE TABLE credit_balances (
  agent_id        UUID PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  balance         INTEGER DEFAULT 1000,
  lifetime_earned INTEGER DEFAULT 0,
  lifetime_spent  INTEGER DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. Credit Ledger
CREATE TABLE credit_ledger (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id) ON DELETE CASCADE,
  transaction_id  UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  delta           INTEGER NOT NULL,
  balance_after   INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ledger_agent ON credit_ledger(agent_id);
CREATE INDEX idx_ledger_created ON credit_ledger(created_at);

-- Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agents are publicly readable" 
  ON agents FOR SELECT USING (is_active = true);
CREATE POLICY "Users can manage their own agents" 
  ON agents FOR ALL USING (user_id = auth.uid());

CREATE POLICY "API keys visible to agent owner only" 
  ON api_keys FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Capabilities are publicly readable" 
  ON capabilities FOR SELECT USING (is_active = true);
CREATE POLICY "Agents manage their own capabilities" 
  ON capabilities FOR ALL USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Participants read their transactions" 
  ON transactions FOR SELECT USING (
    consumer_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
    OR provider_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );
CREATE POLICY "Providers insert transactions" 
  ON transactions FOR INSERT WITH CHECK (
    provider_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Reviews publicly readable" 
  ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can create reviews" 
  ON reviews FOR INSERT WITH CHECK (
    reviewer_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own credit balance" 
  ON credit_balances FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Users see own ledger" 
  ON credit_ledger FOR SELECT USING (
    agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid())
  );

-- Functions
CREATE OR REPLACE FUNCTION search_capabilities(
  query_text TEXT,
  category_filter TEXT DEFAULT NULL,
  min_rating NUMERIC DEFAULT 0,
  max_price INTEGER DEFAULT NULL,
  page_size INTEGER DEFAULT 20,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  description TEXT,
  category TEXT,
  agent_name TEXT,
  agent_slug TEXT,
  avg_rating NUMERIC,
  price_per_call INTEGER,
  total_calls INTEGER,
  relevance NUMERIC
) LANGUAGE SQL STABLE AS $$
  SELECT 
    c.id,
    c.name,
    c.description,
    c.category,
    a.name AS agent_name,
    a.slug AS agent_slug,
    c.avg_rating,
    c.price_per_call,
    c.total_calls,
    ts_rank(to_tsvector('english', c.name || ' ' || c.description), 
            plainto_tsquery('english', query_text)) AS relevance
  FROM capabilities c
  JOIN agents a ON a.id = c.agent_id
  WHERE c.is_active = true
    AND (query_text = '' OR 
         to_tsvector('english', c.name || ' ' || c.description) @@ 
         plainto_tsquery('english', query_text))
    AND (category_filter IS NULL OR c.category = category_filter)
    AND (c.avg_rating >= min_rating)
    AND (max_price IS NULL OR c.price_per_call IS NULL OR c.price_per_call <= max_price)
  ORDER BY relevance DESC, c.avg_rating DESC
  LIMIT page_size OFFSET page_offset;
$$;

-- Trigger to update avg_rating on review insert
CREATE OR REPLACE FUNCTION update_capability_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE capabilities
  SET avg_rating = (
    SELECT AVG(rating)::NUMERIC(3,2)
    FROM reviews
    WHERE capability_id = NEW.capability_id
  ),
  review_count = (
    SELECT COUNT(*)
    FROM reviews
    WHERE capability_id = NEW.capability_id
  )
  WHERE id = NEW.capability_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_capability_rating
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_capability_rating();
