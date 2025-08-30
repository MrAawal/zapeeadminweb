const path = require('path');

module.exports = {
  entry: './src/index.tsx', // Adjust entry point as needed
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'), // Adjust output directory as needed
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/react-native-maps'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-typescript',
              '@babel/preset-react',
            ],
            plugins: [
              '@babel/plugin-transform-runtime',
            ],
          },
        },
      },
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: /node_modules\/react-native-maps/, // Exclude react-native-maps from source-map-loader to avoid parse error
      },
      // Add other loaders for CSS, images, etc. as needed
    ],
  },
  devtool: 'source-map',
  mode: 'development', // or 'production'
  devServer: {
    static: './dist',
    hot: true,
  },
};
