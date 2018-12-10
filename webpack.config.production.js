const path = require('path');
const webpack = require('webpack');

module.exports = {
  cache: true,
  entry: {
    page: './src/kekule.js'
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'lib'),
      'node_modules'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'kekule.min.js',
    libraryTarget: 'commonjs2',
    library: 'kekule'
  },
  module: {
    rules: [
      { 
        test: /\.js$/, 
        loader: 'babel-loader',
        include: path.resolve(__dirname, 'src')
      },
      { test: /\.css$/, use: ['style-loader','css-loader'] },
      { test: /\.woff2?$/, loader: 'url-loader?prefix=font/' },
      { test: /\.ttf$/, loader: 'url-loader?prefix=font/' },
      { test: /\.eot$/, loader: 'url-loader?prefix=font/' },
      { test: /\.svg$/, loader: 'svg-inline-loader' },
      { test: /\.png$/, loader: 'url-loader?prefix=images/' },
      { test: /\.gif$/, loader: 'url-loader?prefix=images/' },
      { test: /\.jpg$/, loader: 'url-loader?prefix=images/' },
      { test: /\.ico$/, loader: 'url-loader?prefix=images/' },
      { test: /\.html$/, loader: 'html-loader' },
      { test: /\.cur$/, loader: 'file-loader' },
    ]
  },
  node: {
    fs: 'empty',
    ws: 'empty'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.optimize.UglifyJsPlugin({
      mangle: {
        except: ['$super']
      }
    })
  ]
};