const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sharedConfig = {
  module: {
    rules: [
      {
        loader: 'ts-loader',
        test: /\.(ts|tsx)$/,
        include: [path.resolve(__dirname, 'src/project')],
        exclude: [path.resolve(__dirname, 'node_modules')]
      },
      {
        loader: 'file-loader',
        test: /\.(woff2?|ttf|otf|eot|svg|html)$/,
        options: {
          name: '[name].[ext]'
        }
      },
      {
        test: /\.scss$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'resolve-url-loader', 'sass-loader']
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  },
  plugins: [
    new ExtraWatchWebpackPlugin({
      files: [
        './src/**/*.scss',
        './src/**/*.html',
        './tsconfig.json'
      ],
    }),
    new MiniCssExtractPlugin({filename: "molstar.css"})
  ],
  resolve: {
    extensions: ['.ts', '.js'],
    modules: [
      'node_modules',
      path.resolve(__dirname, 'src/')
    ],
    alias: {
      Molstar: 'molstar/lib'
    },
  }
}

function createEntryPoint(name, dir, out) {
  return {
    devtool: "source-map",
    node: {fs: 'empty'},
    entry: ["@babel/polyfill", path.resolve(__dirname, `src/project/index.ts`)],
    output: {
      library: 'App',
      libraryTarget: 'umd',
      filename: `${name}.js`,
      path: path.resolve(__dirname, `build/${out}`)
    },
    ...sharedConfig
  }
}

module.exports = [
  createEntryPoint("index", "project", "project")
]
