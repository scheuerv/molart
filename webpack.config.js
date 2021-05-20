const path = require('path');
const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sharedConfig = {
  mode: 'development',
  devServer: {
    port: 1341
  },
  module: {
    rules: [
      {
        loader: 'ts-loader',
        test: /\.(ts|tsx)$/,        
        include: [
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/uniprot-nightingale/src')
          ],
        options: {
          allowTsInNodeModules: true,
          configFile: path.resolve(__dirname, 'tsconfig.json')
        }
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
        './src/**/*.s?css',
        './src/**/*.html',
        './tsconfig.json',
        './node_modules/uniprot-nightingale/**'
      ],
    }),
    new MiniCssExtractPlugin({ filename: "main.css" })
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

function createEntryPoint(name) {
  return {
    devtool: "inline-source-map",
    entry: ["@babel/polyfill", path.resolve(__dirname, `src/index.ts`)],
    output: {
      filename: `${name}.js`,
      path: path.resolve(__dirname, `dist/`)
    },
    externals: {
        "fs": 'require("fs")'
    },
    ...sharedConfig
  }
}

module.exports = [
  createEntryPoint("index")
]
