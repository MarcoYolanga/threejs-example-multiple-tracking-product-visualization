const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.wasm'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      favicon: 'assets/favicon.jpg',
      title: 'Kappa Futur Festival AR',
      minify: {
        collapseWhitespace: true,
        minifyCSS: true,
      },
    }),
    new CopyPlugin({
      patterns: [
        { from: './assets/UI', to: './assets/UI' },
        /* { from: './assets/draco', to: './assets/draco' }, */
      ],
    }),
  ],
  devServer: {
    static: './dist/',
    historyApiFallback: true,
    server: 'https',
    host: '192.168.0.105',
    hot: true,
    open: true,
  },
  module: {
    rules: [
      { test: /\.ts?$/, loader: 'ts-loader' },
      {
        test: /\.(sa|sc|c)ss$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /videorecorder\.wasm$/,
        type: 'javascript/auto',
        loader: 'file-loader',
      },
      {
        test: /\.(zpt|png|gif|glb|gltf|jpe?g|ogg|mp3|obj|fbx|wav|ttf|fnf|woff|stl|mp4|hdr|webm)$/,
        use: [{
          loader: 'file-loader',
          options: {
            outputPath: 'assets',
            name: '[sha256:hash:base64:16].[ext]',
          },
        }],
      },
    ],
  },
};
