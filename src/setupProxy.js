const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app){

  app.use(
      createProxyMiddleware( '/scraper', {
          target: 'http://localhost:3010',
          changeOrigin: true,
      })
  )

};