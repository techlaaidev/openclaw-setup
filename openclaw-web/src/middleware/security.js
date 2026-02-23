/**
 * Security Headers Configuration
 */

export const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: false, // Disabled for HTTP
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'sameorigin' },
  hsts: false, // Disabled for HTTP (only works with HTTPS)
  ieNoOpen: {},
  noSniff: {},
  originAgentCluster: false, // Disabled for HTTP
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  referrerPolicy: { policy: "no-referrer-when-downgrade" },
  xssFilter: {}
};
