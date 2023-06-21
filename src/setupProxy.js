const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app){

  app.use(
      createProxyMiddleware( '/scraper', {
          target: 'http://localhost:3010',
          changeOrigin: true,
      })
  ),

  app.use(
      createProxyMiddleware( '/save', {
        target: 'http://172.30.1.39:8089',
        changeOrigin: true,
        pathRewrite: {
          '^/save': '' // URL ^/api -> 공백 변경
      }
      })
  )

};