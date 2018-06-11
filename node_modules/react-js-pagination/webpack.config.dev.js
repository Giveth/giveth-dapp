var path = require("path");
var webpack = require("webpack");

module.exports = {
  devtool: "cheap-module-source-map",
  entry: [
    "react-hot-loader/patch",
    "webpack-hot-middleware/client",
    "./src/example/index"
  ],
  output: {
    path: path.join(__dirname, "src/example/dist"),
    filename: "bundle.js",
    publicPath: "/src/example/dist/"
  },
  plugins: [
  new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  resolveLoader: { root: path.join(__dirname, "node_modules") },
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel",
        include: path.join(__dirname, "src"),
        exclude: /(node_modules|bower_components)/
      },
      {
        test: /\.less$/,
        loader: "style!css!less"
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: "url-loader?limit=100000"
      }
    ]
  }
};
