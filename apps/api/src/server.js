const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./db');
const { globalErrorHandler, notFoundHandler } = require('./middleware/error-handler');

// Load environment variables
dotenv.config();

// Import routes
const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const analyticsRouter = require('./routes/analytics');
const dashboardRouter = require('./routes/dashboard');
const orderSSE = require('./sse/order-status');
const { assistantRouter } = require('./assistant/engine');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Performance tracking middleware
const performanceStats = {
  requests: {},
  latencies: []
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceStats.latencies.push({ path, duration, timestamp: new Date() });
    performanceStats.requests[path] = (performanceStats.requests[path] || 0) + 1;
  });
  
  next();
});

// Routes
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/assistant', assistantRouter);

// SSE endpoint for order tracking
app.get('/api/orders/:id/stream', orderSSE.streamOrderStatus);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV 
  });
});

// Performance stats endpoint
app.get('/api/performance', (req, res) => {
  const recentLatencies = performanceStats.latencies.slice(-100);
  const avgLatency = recentLatencies.reduce((sum, l) => sum + l.duration, 0) / (recentLatencies.length || 1);
  
  res.json({
    totalRequests: Object.values(performanceStats.requests).reduce((a, b) => a + b, 0),
    requestsByEndpoint: performanceStats.requests,
    averageLatency: Math.round(avgLatency),
    activeSSEConnections: orderSSE.getActiveConnections()
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handling middleware
app.use(globalErrorHandler);

// Start server
async function startServer() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Export for testing
module.exports = app;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}
