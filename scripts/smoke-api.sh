#!/bin/bash
# End-to-end API checks against a running app on $BASE (default http://localhost:3100).
# Start from a fresh fixture database (scripts/smoke-fixtures.sh), start the app against it, then run
# this once: it mutates data (changes the owner password, publishes and deletes articles).
# Requires curl and jq.
BASE=${BASE:-http://localhost:3100}
pass=0; fail=0
check() { # name expected actual
  if [ "$2" == "$3" ]; then pass=$((pass+1)); echo "  ok   $1"; else fail=$((fail+1)); echo "  FAIL $1 (expected '$2', got '$3')"; fi
}
req() { # jar method path [json] -> prints "status body"
  local jar=$1 m=$2 p=$3 d=$4
  if [ -n "$d" ]; then curl -s -o /tmp/body -w "%{http_code}" -b $jar -c $jar -X $m -H 'Content-Type: application/json' --data "$d" "$BASE$p"
  else curl -s -o /tmp/body -w "%{http_code}" -b $jar -c $jar -X $m "$BASE$p"; fi
}
rm -f /tmp/j_*
LAB='circuit \"Lamp\" version 1 {\n  s: INPUT()\n  q: OUTPUT()\n  s.Q -> q.A\n}'
art() { echo "{\"slug\":\"$1\",\"title\":\"$2\",\"author\":\"$3\",\"sections\":[{\"type\":\"markdown\",\"content\":\"Hello\"},{\"type\":\"lab\",\"title\":\"Lab\",\"dsl\":\"$LAB\"}]}"; }

echo "== sign-in"
check "old owner email no longer works" 401 $(req /tmp/j_x POST /api/auth/signin '{"identifier":"legacy-owner@industrialautomation.website","password":"owner-password-123"}')
check "owner signs in with handle" 200 $(req /tmp/j_owner POST /api/auth/signin '{"identifier":"alex_eng_aut","password":"owner-password-123"}')
check "owner flag in response" true $(jq -r .data.user.isOwner /tmp/body)
check "no password hash leaked" null $(jq -r .data.user.password_hash /tmp/body)
check "owner signs in with new email" 200 $(req /tmp/j_owner2 POST /api/auth/signin '{"identifier":"alex_eng_aut@industrialautomation.website","password":"owner-password-123"}')
check "wrong password" 401 $(req /tmp/j_x POST /api/auth/signin '{"identifier":"alex_eng_aut","password":"nope"}')
check "first-name login removed (Bob)" 401 $(req /tmp/j_x POST /api/auth/signin '{"identifier":"Bob","password":"bob-password-1"}')
check "bob signs in by email" 200 $(req /tmp/j_bob POST /api/auth/signin '{"identifier":"bob@example.com","password":"bob-password-1"}')
check "me: bob not owner" false $(req /tmp/j_bob GET /api/auth/me >/dev/null; jq -r .data.user.isOwner /tmp/body)
check "session cookie is HttpOnly" 1 $(grep -c "#HttpOnly_localhost.*ah_session" /tmp/j_bob)

echo "== sign-up"
check "username with spaces rejected" 400 $(req /tmp/j_x POST /api/auth/signup '{"name":"alex eng aut","email":"a@b.co","password":"longpassword"}')
check "short password rejected" 400 $(req /tmp/j_x POST /api/auth/signup '{"name":"alice","email":"alice@example.com","password":"short"}')
check "duplicate of owner handle rejected" 409 $(req /tmp/j_x POST /api/auth/signup '{"name":"ALEX_ENG_AUT","email":"z@example.com","password":"longpassword"}')
check "'alazar' name gets no special rights" 201 $(req /tmp/j_alice POST /api/auth/signup '{"name":"alazar_fake","email":"alice@example.com","password":"longpassword"}')
check "alice is not owner" false $(jq -r .data.user.isOwner /tmp/body)

echo "== articles: permissions"
check "list requires sign-in" 401 $(req /tmp/j_none GET '/api/articles?scope=mine')
check "public listing endpoint not exposed" 400 $(req /tmp/j_none GET /api/articles)
check "save requires sign-in" 401 $(req /tmp/j_none POST /api/articles "$(art anon-post 'Anon post' x)")
check "bob cannot overwrite core masterclass" 403 $(req /tmp/j_bob POST /api/articles "$(art traffic-lights 'Hijack' x)")
check "bob cannot take over legacy (authorless) row" 403 $(req /tmp/j_bob POST /api/articles "$(art legacy-post 'Hijack' x)")
check "bob publishes his own article" 200 $(req /tmp/j_bob POST /api/articles "$(art bob-article 'Bob article' alex_eng_aut)")
check "bob cannot impersonate author" "Bob Smith" "$(jq -r .data.article.author /tmp/body)"
check "reading time estimated" "1 min read + 1 lab" "$(jq -r .data.article.readingTime /tmp/body)"
check "alice cannot edit bob's article" 403 $(req /tmp/j_alice POST /api/articles "$(art bob-article 'Mine now' x)")
check "alice cannot delete bob's article" 403 $(req /tmp/j_alice DELETE /api/articles/bob-article)
check "bob sees only his article" "bob-article" "$(req /tmp/j_bob GET '/api/articles?scope=mine' >/dev/null; jq -r '[.data.articles[].slug]|join(",")' /tmp/body)"
check "owner may edit bob's article" 200 $(req /tmp/j_owner POST /api/articles "$(art bob-article 'Bob article (edited by owner)' x)")
check "original author kept after owner edit" "bob-article" "$(req /tmp/j_bob GET '/api/articles?scope=mine' >/dev/null; jq -r '[.data.articles[].slug]|join(",")' /tmp/body)"
check "owner edits core masterclass" 200 $(req /tmp/j_owner POST /api/articles "$(art traffic-lights 'Traffic (owner edit)' '')")
check "owner byline defaults to handle" alex_eng_aut "$(jq -r .data.article.author /tmp/body)"
check "public GET article has no email" null "$(req /tmp/j_none GET /api/articles/bob-article >/dev/null; jq -r .data.article.authorEmail /tmp/body)"

echo "== articles: validation"
check "invalid circuit rejected" 400 $(req /tmp/j_bob POST /api/articles '{"slug":"bad-lab","title":"Bad lab","sections":[{"type":"lab","title":"L","dsl":"circuit \"x\" version 1 { a: NOPE() }"}]}')
check "javascript: image rejected" 400 $(req /tmp/j_bob POST /api/articles '{"slug":"bad-img","title":"Bad image","sections":[{"type":"image","src":"javascript:alert(1)"}]}')
check "bad slug rejected" 400 $(req /tmp/j_bob POST /api/articles '{"slug":"Bad Slug!","title":"Title","sections":[{"type":"markdown","content":"x"}]}')
check "malformed JSON rejected" 400 $(req /tmp/j_bob POST /api/articles '{not json')
check "invalid slug in URL rejected" 400 $(req /tmp/j_bob DELETE '/api/articles/..%2Fetc')

echo "== views"
check "record a view" 200 $(req /tmp/j_none POST /api/views '{"slug":"water-treatment"}')
check "count incremented from legacy 29" 30 $(jq -r .data.views /tmp/body)
check "junk slug rejected" 400 $(req /tmp/j_none POST /api/views '{"slug":"Automated%20Conveyor Sorting"}')

echo "== password change & sessions"
check "change needs sign-in" 401 $(req /tmp/j_none POST /api/auth/change-password '{"currentPassword":"x","newPassword":"longpassword2"}')
check "wrong current password" 401 $(req /tmp/j_owner POST /api/auth/change-password '{"currentPassword":"wrong","newPassword":"longpassword2"}')
check "change password" 200 $(req /tmp/j_owner POST /api/auth/change-password '{"currentPassword":"owner-password-123","newPassword":"owner-password-456"}')
check "current session survives" alex_eng_aut "$(req /tmp/j_owner GET /api/auth/me >/dev/null; jq -r .data.user.name /tmp/body)"
check "other session revoked" null "$(req /tmp/j_owner2 GET /api/auth/me >/dev/null; jq -r .data.user /tmp/body)"
check "old password no longer works" 401 $(req /tmp/j_x POST /api/auth/signin '{"identifier":"alex_eng_aut","password":"owner-password-123"}')
cp /tmp/j_bob /tmp/j_bob_copy
check "sign out" 200 $(req /tmp/j_bob POST /api/auth/signout)
check "stolen copy of cookie is dead after sign-out" null "$(req /tmp/j_bob_copy GET /api/auth/me >/dev/null; jq -r .data.user /tmp/body)"

echo "== rate limiting"
for i in 1 2 3 4 5 6 7 8; do req /tmp/j_x POST /api/auth/signin '{"identifier":"nobody-here","password":"guess'$i'"}' >/dev/null; done
check "9th failed sign-in for one account is throttled" 429 $(req /tmp/j_x POST /api/auth/signin '{"identifier":"nobody-here","password":"guess9"}')
check "throttle message says how long to wait" 1 $(grep -c "Please wait" /tmp/body)
check "other accounts are unaffected" 401 $(req /tmp/j_x POST /api/auth/signin '{"identifier":"someone-else","password":"x"}')

echo "== challenge progress"
check "progress needs sign-in" 401 $(req /tmp/j_none POST /api/progress '{"solved":[]}')
check "sync local progress" 200 $(req /tmp/j_owner POST /api/progress '{"solved":[{"slug":"light-switch","solvedAt":"2026-01-02T00:00:00Z"},{"slug":"made-up","solvedAt":"2026-01-02T00:00:00Z"}]}')
check "unknown challenge dropped" null $(jq -r '.data.progress["made-up"]' /tmp/body)
check "earlier solve from another device wins" "2026-01-01T00:00:00.000Z" $(req /tmp/j_owner POST /api/progress '{"solved":[{"slug":"light-switch","solvedAt":"2026-01-01T00:00:00Z"},{"slug":"start-stop","solvedAt":"2026-02-01T00:00:00Z"}]}' >/dev/null; jq -r '.data.progress["light-switch"].solvedAt' /tmp/body)
check "later solve does not overwrite" "2026-01-01T00:00:00.000Z" $(req /tmp/j_owner POST /api/progress '{"solved":[{"slug":"light-switch","solvedAt":"2026-03-01T00:00:00Z"}]}' >/dev/null; jq -r '.data.progress["light-switch"].solvedAt' /tmp/body)
check "GET returns both solves" 2 $(req /tmp/j_owner GET /api/progress >/dev/null; jq -r '.data.progress | length' /tmp/body)

echo "== owner restores core masterclass"
check "owner deletes override" 200 $(req /tmp/j_owner DELETE /api/articles/traffic-lights)

echo; echo "passed $pass, failed $fail"
[ $fail -eq 0 ]
