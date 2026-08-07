CREATE TABLE conversations (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'email', 'web')),
  external_id TEXT NOT NULL,
  customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
  display_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('open', 'pending', 'resolved')),
  ai_enabled INTEGER NOT NULL DEFAULT 1 CHECK (ai_enabled IN (0, 1)),
  unread_count INTEGER NOT NULL DEFAULT 0 CHECK (unread_count >= 0),
  last_message_at TEXT,
  last_message_preview TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (channel, external_id)
) STRICT;

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  author TEXT NOT NULL CHECK (author IN ('customer', 'ai', 'admin', 'system')),
  admin_id TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  body TEXT NOT NULL,
  wa_message_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('received', 'draft', 'sent', 'delivered', 'read', 'failed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
