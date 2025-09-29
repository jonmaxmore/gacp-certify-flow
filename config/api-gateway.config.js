// config/api-gateway.config.js
module.exports = {
  // Kong API Gateway Configuration
  kong: {
    admin_api_url: process.env.KONG_ADMIN_API_URL || 'http://localhost:8001',
    proxy_url: process.env.KONG_PROXY_URL || 'http://localhost:8000',
    
    // Service definitions
    services: {
      core_certification: {
        name: 'core-certification-service',
        url: 'http://core-certification:3001',
        protocol: 'http',
        host: 'core-certification',
        port: 3001,
        path: '/api/v1',
        retries: 5,
        connect_timeout: 60000,
        write_timeout: 60000,
        read_timeout: 60000
      },
      
      standards_analysis: {
        name: 'standards-analysis-service',
        url: 'http://standards-analysis:3002',
        protocol: 'http',
        host: 'standards-analysis',
        port: 3002,
        path: '/api/v1',
        retries: 3,
        connect_timeout: 30000
      },
      
      survey_management: {
        name: 'survey-management-service',
        url: 'http://survey-management:3003',
        protocol: 'http',
        host: 'survey-management',
        port: 3003,
        path: '/api/v1'
      }
    },
    
    // Route definitions
    routes: {
      core_certification: [
        {
          name: 'applications-route',
          paths: ['/api/v1/applications'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          strip_path: false,
          preserve_host: true
        },
        {
          name: 'payments-route',
          paths: ['/api/v1/payments'],
          methods: ['GET', 'POST'],
          strip_path: false,
          preserve_host: true
        }
      ]
    },
    
    // Plugin configurations
    plugins: {
      jwt: {
        name: 'jwt',
        enabled: true,
        config: {
          secret_is_base64: false,
          claims_to_verify: ['exp', 'nbf'],
          key_claim_name: 'iss',
          maximum_expiration: 1800, // 30 minutes
          algorithm: 'RS256',
          run_on_preflight: false
        }
      },
      
      rate_limiting: {
        name: 'rate-limiting',
        enabled: true,
        config: {
          minute: 100,
          hour: 1000,
          policy: 'cluster',
          fault_tolerant: true,
          hide_client_headers: false,
          redis_ssl: true,
          redis_ssl_verify: false
        }
      },
      
      cors: {
        name: 'cors',
        enabled: true,
        config: {
          origins: ['https://gacp.dtam.go.th', 'http://localhost:3000'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          headers: ['Accept', 'Content-Type', 'Authorization'],
          exposed_headers: ['X-Total-Count', 'X-Page-Number'],
          credentials: true,
          max_age: 3600
        }
      }
    }
  }
};