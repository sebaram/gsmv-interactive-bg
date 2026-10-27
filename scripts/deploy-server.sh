#!/usr/bin/env bash
set -Eeuo pipefail

: "${GSMV_ADMIN_PASSWORD_HASH:?Set the GSMV_ADMIN_PASSWORD_HASH repository secret}"
: "${GITHUB_SHA:?Missing commit identifier}"
[[ "$GITHUB_SHA" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid commit identifier'; exit 1; }
export GSMV_PUBLIC_ORIGIN=https://mvbg.arrc.app
image="mvbg-site:${GITHUB_SHA}"
candidate="mvbg-candidate-${GITHUB_SHA:0:12}"
backup="mvbg-site-backup-$(date +%Y%m%d%H%M%S)"
had_previous=false
switched=false

healthy() {
  local port="$1"
  for attempt in {1..30}; do
    if curl --fail --silent --max-time 2 "http://127.0.0.1:${port}/api/health" >/dev/null; then return 0; fi
    sleep 1
  done
  return 1
}

cleanup() {
  local result=$?
  docker rm -f "$candidate" >/dev/null 2>&1 || true
  if [[ "$result" != 0 && "$switched" == true ]]; then
    if [[ "$had_previous" == true ]] && docker container inspect "$backup" >/dev/null 2>&1; then
      docker rm -f mvbg-site >/dev/null 2>&1 || true
      docker rename "$backup" mvbg-site
      docker start mvbg-site >/dev/null
      echo 'Deployment failed; restored the previous container.'
    elif [[ "$had_previous" == true ]]; then
      docker start mvbg-site >/dev/null
    else
      docker rm -f mvbg-site >/dev/null 2>&1 || true
    fi
  fi
  exit "$result"
}
trap cleanup EXIT

docker build --tag "$image" .
docker volume create mvbg-data >/dev/null
runtime=(--env GSMV_ADMIN_PASSWORD_HASH --env GSMV_PUBLIC_ORIGIN
  --mount type=volume,source=mvbg-data,target=/data
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m
  --cap-drop ALL --security-opt no-new-privileges
  --pids-limit 128 --memory 1g --cpus 2
  --log-opt max-size=10m --log-opt max-file=3)
docker run -d --name "$candidate" -p 127.0.0.1::8765 "${runtime[@]}" "$image" >/dev/null
candidate_port=$(docker port "$candidate" 8765/tcp | cut -d: -f2)
healthy "$candidate_port" || { echo 'Candidate health check failed.'; exit 1; }
docker rm -f "$candidate" >/dev/null

if docker container inspect mvbg-site >/dev/null 2>&1; then
  had_previous=true
  switched=true
  docker stop mvbg-site >/dev/null
  docker rename mvbg-site "$backup"
fi
switched=true
docker run -d --name mvbg-site --restart unless-stopped \
  -p 127.0.0.1:8711:8765 "${runtime[@]}" "$image" >/dev/null
healthy 8711 || { echo 'Production health check failed.'; exit 1; }
curl --fail --silent --show-error --retry 3 --max-time 15 https://mvbg.arrc.app/api/health
echo
echo "Deployed ${GITHUB_SHA} at https://mvbg.arrc.app"
if [[ "$had_previous" == true ]]; then echo "Previous container retained as ${backup}"; fi
