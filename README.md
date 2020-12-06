## ETChash-Solo-Pool
Based on https://github.com/caesarsalad/eth-solo-pool and https://github.com/etclabscore/open-etc-pool
Web frontend from https://github.com/esprezzo/open-perkle-pool
Originally from https://github.com/sammy007/open-ethereum-pool

### Building on Ubuntu 18.04

**Install dependencies**

* Install Go Programming Language, Redis and Nginx
```sh
sudo apt install golang redis-server nginx
```

* Install Node Version Manager as described here https://github.com/nvm-sh/nvm#install--update-script

* Build and run core-geth 
```sh
git clone https://github.com/etclabscore/core-geth
cd core-geth
make geth
mv build/bin/geth /usr/bin/core-geth
# this address should be used as coinbase if payouts enabled:
core-geth --classic account new
# use --txpool.locals option if you want to include "own" pool transactions into block will be mined by pool;
# replace 0x0 with coinbase address:
screen -dmS core-geth core-geth --classic -http --mine --miner.etherbase 0x0 --unlock 0x0 --password /path/to/password/file --allow-insecure-unlock --txpool.locals 0x0
```

**Build and run pool**

```sh
git clone https://github.com/e4p1k0/etchash-solo-pool
cd etchash-solo-pool
make
```

* Edit configuration files in configs/ directory. Config files allows to run the pool as separate modules: api, stratums, unlocker and payout.

Example below is "all-in-one" config with all modules enabled:
```javascript
{
    // The number of cores of CPU.
    "threads": 2,
    // Prefix for keys in redis store.
    "coin": "etc-solo",
    // Give unique name to each instance.
    "name": "main",
    // PPLNS rounds. It doesn't matter with SOLO payouts schema.
    "pplns": 1000,

    "proxy": {
            "enabled": true,
            // Bind HTTP mining endpoint to this IP:PORT. Set it to localhost if you want only stratum mode.
            "listen": "127.0.0.1:8888",
            // Allow only this header and body size of HTTP request from miners.
            "limitHeadersSize": 1024,
            "limitBodySize": 256,
            /* Set to true if you are behind CloudFlare (not recommended) or behind http-reverse
            proxy to enable IP detection from X-Forwarded-For header.
            Advanced users only. It's tricky to make it right and secure.
            */
            "behindReverseProxy": false,

            // Stratum mining endpoint.
            "stratum": {
                    "enabled": true,
                    // Bind stratum mining socket to this IP:PORT.
                    "listen": "0.0.0.0:8008",
                    "timeout": "120s",
                    "maxConn": 8192
            },

            // Try to get new job from geth in this interval.
            "blockRefreshInterval": "120ms",
            "stateUpdateInterval": "3s",
            // If there are many rejects because of heavy hash, difficulty should be increased properly.
            "difficulty": 4000000000,
            /* Reply error to miner instead of job if redis is unavailable.
            Should save electricity to miners if pool is sick and they didn't set up failovers.
            */
            "healthCheck": true,
            // Mark pool sick after this number of redis failures.
            "maxFails": 100,
            // TTL for workers stats, usually should be equal to large hashrate window from API section.
            "hashrateExpiration": "3h",

            "policy": {
                    "workers": 8,
                    "resetInterval": "60m",
                    "refreshInterval": "1m",
                    "banning": {
                            "enabled": false,
                            /* Name of ipset for banning.
                            Check http://ipset.netfilter.org/ documentation.
                            */
                            "ipset": "blacklist",
                            // Remove ban after this amount of time.
                            "timeout": 1800,
                            // Percent of invalid shares from all shares to ban miner.
                            "invalidPercent": 30,
                            // Check after after miner submitted this number of shares.
                            "checkThreshold": 30,
                            // Bad miner after this number of malformed requests.
                            "malformedLimit": 5
                    },
                    // Connection rate limit.
                    "limits": {
                            "enabled": false,
                            // Number of initial connections.
                            "limit": 30,
                            "grace": "5m",
                            // Increase allowed number of connections on each valid share.
                            "limitJump": 10
                    }
            }
    },

    // Provides JSON data for frontend which is static website.
    "api": {
        "enabled": true,
        "listen": "0.0.0.0:8080",
        // Collect miners stats (hashrate, ...) in this interval.
        "statsCollectInterval": "5s",
        // Purge stale stats interval.
        "purgeInterval": "10m",
        // Fast hashrate estimation window for each miner from it's shares.
        "hashrateWindow": "30m",
        // Long and precise hashrate from shares, 3h is cool, keep it.
        "hashrateLargeWindow": "3h",
        // Collect stats for shares/diff ratio for this number of blocks.
        "luckWindow": [64, 128, 256],
        // Max number of payments to display in frontend.
        "payments": 50,
        // Max numbers of blocks to display in frontend.
        "blocks": 50,
        // Frontend Chart related settings. Use crontab format.
        "poolCharts":"*/20 * * * *",
        "poolChartsNum":74,
        "minerCharts":"*/20 * * * *",
        "minerChartsNum":74
        /* If you are running API node on a different server where this module
        is reading data from redis writeable slave, you must run an api instance with this option enabled in order to purge hashrate stats from main redis node.
        Only redis writeable slave will work properly if you are distributing using redis slaves.
        Very advanced. Usually all modules should share same redis instance.
        */
        "purgeOnly": false
    },

    // Check health of each geth node in this interval
    "upstreamCheckInterval": "5s",

    /* List of geth nodes to poll for new jobs. Pool will try to get work from
    first alive one and check in background for failed to back up.
    Current block template of the pool is always cached in RAM indeed.
    */
    "upstream": [
        {
            "name": "main",
            "url": "http://127.0.0.1:8545",
            "timeout": "10s"
        },
        {
            "name": "backup",
            "url": "http://127.0.0.2:8545",
            "timeout": "10s"
        }
    ],

    // This is standard redis connection options.
    "redis": {
            // Where your redis instance is listening for commands.
            // NOTE THAT THE POOL IS CONFIGURED FOR Redis database "0".
            "endpoint": "127.0.0.1:6379",
            "poolSize": 10,
            "database": 0,
            "password": ""
    },

    // This module periodically remits ether to miners.
    "unlocker": {
            "enabled": false,
            // Pool fee percentage.
            "poolFee": 1.0,
            // The address is for pool fee. Personal wallet is recommended to prevent from server hacking.
            "poolFeeAddress": "0x0",
            "donate": false,
            // Unlock only if this number of blocks mined back.
            "depth": 120,
            // Simply don't touch this option.
            "immatureDepth": 20,
            // Keep mined transaction fees as pool fees.
            "keepTxFees": false,
            // Run unlocker in this interval.
            "interval": "10m",
            // Geth instance node rpc endpoint for unlocking blocks.
            "daemon": "http://127.0.0.1:8545",
            // Rise error if can't reach geth in this amount of time.
            "timeout": "10s"
    },

    // Pay out miners using this module.
    "payouts": {
            "enabled": true,
            // Require minimum number of peers on node.
            "requirePeers": 15,
            // Run payouts in this interval.
            "interval": "20m",
            // Geth instance node rpc endpoint for payouts processing.
            "daemon": "http://127.0.0.1:8545",
            // Rise error if can't reach geth in this amount of time.
            "timeout": "10s",
            // Address with pool coinbase wallet address.
            "address": "0x0",
            // Let geth to determine Gas Limit and Gas Price.
            "autoGas": false,
            // Gas Limit amount and Gas Price in Wei for payout tx (advanced users only).
            "gas": "21000",
            "gasPrice": "1000000000",
            // The minimum distribution of mining reward in GWei (Shannon). It is 3 ETC now.
            "threshold": 3000000000,
            // Perform BGSAVE on Redis after successful payouts session.
            "bgsave": false
            "concurrentTx": 10
    }
}
```

* Run the pool
```sh
screen -dmS etc-api ./build/bin/open-etc-pool configs/api.json
screen -dmS etc-stratum ./build/bin/open-etc-pool configs/stratum4b.json
screen -dmS etc-unlocker ./build/bin/open-etc-pool configs/unlocker.json
screen -dmS etc-payout ./build/bin/open-etc-pool configs/payout.json
```

**Build the frontend**
```sh
cd www
```

* Edit config/environment.js. Here 7070 port is where you want the web frontend to be:
```javascript
        ApiUrl: '//11.22.33.44:7070/',
```

```sh
nvm use v8.17.0
npm install -g ember-cli@2.9.1
npm install -g bower
npm install
bower install
./build.sh
```

* Edit /etc/nginx/sites-available/default file with sudo. Here upstream port is the same as in configs/api.json, server port is the same as in www/config/environment.js:
```
upstream etc {
	server 127.0.0.1:8080;
}

server {
	listen 0.0.0.0:7070;
	root /path/to/etchash-solo-pool/www/dist;
	index index.html index.htm;

	server_name localhost;

	location /api {
		proxy_pass http://etc;
	}

	location / {
		try_files $uri $uri/ /index.html;
	}
}
```

* Restart Nginx
```sh
sudo systemctl restart nginx
```
