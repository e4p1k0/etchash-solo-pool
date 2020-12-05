/* jshint node: true */

module.exports = function(environment) {
  var ENV = {
    modulePrefix: 'open-social-pool',
    environment: environment,
    rootURL: '/',
    locationType: 'hash',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
      }
    },

    APP: {
      // API host and port
      ApiUrl: '//11.22.33.44:7070/',
      PoolName: 'ΞTChash Solo Pool',
      CompanyName: 'ΞTChash Solo Pool',
      // HTTP mining endpoint
      HttpHost: '11.22.33.44',
      HttpPort: 8008,

      // Stratum mining endpoint
      StratumHost: '11.22.33.44',
      StratumPort: 8008,

      // Fee and payout details
      PoolFee: '1.0%',
      PayoutThreshold: '3.0',
      PayoutInterval: '20m',

      // For network hashrate (change for your favourite fork)
      BlockTime: 14.4,
      BlockReward: 3.2,
      Unit: 'ETC:',

    }
  };

  if (environment === 'development') {
    /* Override ApiUrl just for development, while you are customizing
      frontend markup and css theme on your workstation.
    */
    ENV.APP.ApiUrl = '//11.22.33.44:7070/'
    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {

  }

  return ENV;
};
