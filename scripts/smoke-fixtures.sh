#!/bin/bash
# Recreates a database shaped like production before the 2026-11 restructure (legacy owner,
# plaintext session, email inside article JSON), so migrations and scripts/smoke-api.sh can be
# tested end to end.  Usage:  PSQL="psql -h localhost -U app" bash scripts/smoke-fixtures.sh
set -euo pipefail
PSQL=${PSQL:-psql -h localhost -U app}
DB=${DB:-automationhub}
hash() { node -e "const c=require('crypto');const s=c.randomBytes(16).toString('hex');console.log(s+':'+c.scryptSync(process.argv[1],s,64).toString('hex'))" "$1"; }
$PSQL -d postgres -q -c "DROP DATABASE IF EXISTS $DB WITH (FORCE)" -c "CREATE DATABASE $DB"
$PSQL -d $DB -q <<SQL
CREATE TABLE users (id VARCHAR(64) PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, role VARCHAR(255) DEFAULT 'Engineer', station_id VARCHAR(128) DEFAULT 'TERMINAL-LOCAL-01', avatar VARCHAR(16) DEFAULT 'AW', bio TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE sessions (id VARCHAR(128) PRIMARY KEY, user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE articles (slug VARCHAR(128) PRIMARY KEY, title TEXT NOT NULL, excerpt TEXT, author VARCHAR(255) NOT NULL, author_url TEXT, date_str VARCHAR(64), reading_time VARCHAR(64), tag VARCHAR(64), views INT DEFAULT 1, content_json JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), author_id VARCHAR(64), author_email VARCHAR(255));
CREATE TABLE article_views (slug VARCHAR(128) PRIMARY KEY, views INT DEFAULT 1, updated_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO article_views VALUES ('water-treatment', 29, NOW()), ('traffic-lights', 26, NOW());
INSERT INTO users (id,name,email,password_hash,role) VALUES ('usr-alazar-lead','Legacy Owner','legacy-owner@industrialautomation.website','$(hash owner-password-123)','Senior');
INSERT INTO users (id,name,email,password_hash) VALUES ('usr-bob','Bob Smith','bob@example.com','$(hash bob-password-1)');
INSERT INTO sessions VALUES ('plaintext-legacy-token','usr-bob', NOW() + interval '10 days', NOW());
INSERT INTO articles (slug,title,excerpt,author,author_id,author_email,content_json) VALUES ('legacy-post','Legacy post','x','Someone',NULL,'someone@example.com','{"slug":"legacy-post","title":"Legacy post","excerpt":"x","author":"Someone","authorEmail":"someone@example.com","views":14,"date":"Oct 1","readingTime":"3 min","tag":"Old","sections":[{"type":"markdown","content":"Old [bad](javascript:alert(1)) link"}]}');
SQL
echo "Fixtures ready in $DB."
