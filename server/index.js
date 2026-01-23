import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()
const PORT = process.env.PORT || 3001

// Parse JSON body for logging
app.use(express.json({ limit: '10mb' }))

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Client-Request-Id')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
})

// Allowed target domains (whitelist for security)
const ALLOWED_DOMAINS = [
  'api.openai.com',
  'api.anthropic.com',
  'api.deepseek.com',
  'api.moonshot.cn',
  'api.groq.com',
  'ai.megallm.io',
  'localhost',
  '127.0.0.1',
]

// Proxy endpoint
app.use('/api/proxy', (req, res, next) => {
  const target = req.query.target
  if (!target) {
    return res.status(400).json({ error: 'Missing target URL parameter' })
  }

  // Security: validate target domain
  try {
    const targetUrl = new URL(target)
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      targetUrl.hostname === domain || targetUrl.hostname.endsWith('.' + domain)
    )
    if (!isAllowed) {
      return res.status(403).json({ error: 'Target domain not allowed' })
    }
  } catch {
    return res.status(400).json({ error: 'Invalid target URL' })
  }

  // Extract API key from custom header
  const apiKey = req.headers['x-api-key']
  
  const proxy = createProxyMiddleware({
    target: new URL(target).origin,
    changeOrigin: true,
    pathRewrite: () => new URL(target).pathname,
    onProxyReq: (proxyReq, req) => {
      // Add Authorization header if API key provided
      if (apiKey) {
        proxyReq.setHeader('Authorization', `Bearer ${apiKey}`)
      }
      // Remove our custom header
      proxyReq.removeHeader('x-api-key')
      
      // Log request
      console.log(`[${new Date().toISOString()}] ${req.method} ${target}`)
    },
    onProxyRes: (proxyRes) => {
      // Log response
      console.log(`[${new Date().toISOString()}] Response: ${proxyRes.statusCode}`)
    },
    onError: (err, req, res) => {
      console.error(`[${new Date().toISOString()}] Proxy error:`, err.message)
      res.status(500).json({ error: 'Proxy error', message: err.message })
    },
  })

  proxy(req, res, next)
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})
