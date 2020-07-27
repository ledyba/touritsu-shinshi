import WriteFilePlugin from 'write-file-webpack-plugin';

const conf = {
  context: __dirname,
  entry: {
    'main': './src/main.ts',
  },
  mode: "development",
  output: {
    path: __dirname + '/dist',
    filename: '[name].js',
    publicPath: '/dist/'
  },
  plugins: [
    new WriteFilePlugin(),
  ],
  module: {
    rules: [{
      test: /\.ts$/,
      use: "ts-loader",
    }]
  },
  resolve: {
    extensions: [
      '.ts',
      '.js'
    ]
  },
};

export default conf;