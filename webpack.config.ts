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