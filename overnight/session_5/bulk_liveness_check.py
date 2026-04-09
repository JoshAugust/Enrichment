#!/usr/bin/env python3
"""
Bulk website liveness checker. Reads domains from a file, checks if they resolve
and return a 200. Outputs JSON with results.

Usage: python3 bulk_liveness_check.py <domains_file> <output_file>
"""
import sys
import json
import urllib.request
import urllib.error
import ssl
import socket
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

PARKED_PATTERNS = re.compile(
    r'(this domain|domain is for sale|buy this domain|parked by|godaddy|'
    r'domain parking|sedo\.com|afternic|dan\.com|hugedomains|'
    r'coming soon|under construction|website is under|'
    r'default web page|apache2 default|nginx welcome|'
    r'this site can.t be reached|page not found|'
    r'domain has expired|account suspended|'
    r'web hosting by|powered by cpanel)', re.I
)

GOV_PATTERN = re.compile(r'\.(gov|mil|edu)$', re.I)

def check_domain(domain):
    domain = domain.strip()
    if not domain:
        return None
    
    result = {
        'domain': domain,
        'live': False,
        'status_code': None,
        'is_parked': False,
        'is_gov': bool(GOV_PATTERN.search(domain)),
        'redirect_domain': None,
        'error': None,
        'checked_at': datetime.now(timezone.utc).isoformat()
    }
    
    if result['is_gov']:
        result['error'] = 'gov_domain'
        return result
    
    for scheme in ['https', 'http']:
        url = f'{scheme}://{domain}'
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        })
        try:
            with urllib.request.urlopen(req, timeout=8, context=ctx) as resp:
                result['status_code'] = resp.status
                final_url = resp.url
                # Check if redirected to a different domain
                if final_url:
                    from urllib.parse import urlparse
                    redirect_host = urlparse(final_url).hostname or ''
                    redirect_host = redirect_host.lower().replace('www.', '')
                    if redirect_host and redirect_host != domain.replace('www.', ''):
                        result['redirect_domain'] = redirect_host
                
                if resp.status == 200:
                    html = resp.read(50000).decode('utf-8', errors='replace')
                    if PARKED_PATTERNS.search(html):
                        result['is_parked'] = True
                    else:
                        result['live'] = True
                    return result
        except urllib.error.HTTPError as e:
            result['status_code'] = e.code
            result['error'] = f'http_{e.code}'
        except (urllib.error.URLError, socket.timeout, ConnectionError, OSError) as e:
            result['error'] = str(e)[:100]
        except Exception as e:
            result['error'] = str(e)[:100]
    
    return result

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 bulk_liveness_check.py <domains_file> <output_file>", file=sys.stderr)
        sys.exit(1)
    
    domains_file = sys.argv[1]
    output_file = sys.argv[2]
    
    with open(domains_file) as f:
        domains = [line.strip() for line in f if line.strip()]
    
    print(f"[LIVENESS] Checking {len(domains)} domains...", file=sys.stderr, flush=True)
    
    results = []
    dead_count = 0
    parked_count = 0
    live_count = 0
    gov_count = 0
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(check_domain, d): d for d in domains}
        for i, future in enumerate(as_completed(futures)):
            r = future.result()
            if r:
                results.append(r)
                if r['is_gov']:
                    gov_count += 1
                elif r['is_parked']:
                    parked_count += 1
                elif r['live']:
                    live_count += 1
                else:
                    dead_count += 1
            
            if (i + 1) % 50 == 0:
                print(f"[LIVENESS] {i+1}/{len(domains)} — live:{live_count} dead:{dead_count} parked:{parked_count} gov:{gov_count}", 
                      file=sys.stderr, flush=True)
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n[LIVENESS] DONE. Total: {len(results)}", file=sys.stderr, flush=True)
    print(f"  Live: {live_count} ({live_count*100//len(results)}%)", file=sys.stderr, flush=True)
    print(f"  Dead: {dead_count} ({dead_count*100//len(results)}%)", file=sys.stderr, flush=True)
    print(f"  Parked: {parked_count} ({parked_count*100//len(results)}%)", file=sys.stderr, flush=True)
    print(f"  Gov: {gov_count}", file=sys.stderr, flush=True)

if __name__ == '__main__':
    main()
