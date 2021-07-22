const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const sharedConfig = {
  mode: 'production',
  module: {
    rules: [
      {
        loader: 'ts-loader',
        test: /\.(ts|tsx)$/,
        include: [
          path.resolve(__dirname, 'src')
        ],
        options: {
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
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /bootstrap-multiselect.*\.js/,
        use: [
          {
            loader: "imports-loader",
            options: {
              type: "commonjs",
              imports: [
                {
                  moduleName: "knockout",
                  name: "ko",
                },
                {
                  moduleName: "jquery",
                  name: "$",
                }
              ],
              wrapper: "{jQuery:$, ko:ko}"
            },
          },
        ]
      }
    ]
  },
  plugins: [
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
    entry: [path.resolve(__dirname, `src/index.ts`)],
    output: {
      filename: `${name}.js`,
      path: path.resolve(__dirname, `dist/`),
      library: {
        type: "assign",
        name: "Molart"
      }
    },
    externals: {
      "fs": 'require("fs")'
    },
    ignoreWarnings: [
      {
        module: /bootstrap-multiselect\.js\?/,
      },
      (warning) => true,
    ],
    ...sharedConfig
  }
}
function createExampleEntryPoint(name) {
  return {
    devtool: "inline-source-map",
    entry: [path.resolve(__dirname, `src/examples/index.ts`)],
    output: {
      filename: `${name}.js`,
      path: path.resolve(__dirname, `dist/examples`),
      library: {
        type: 'assign',
        name: 'MolArtExamples'
      }
    },
    externals: {
      "fs": 'require("fs")'
    },
    ...sharedConfig
  }
}

module.exports = [
  createEntryPoint("index"),
  createExampleEntryPoint("example")
]
