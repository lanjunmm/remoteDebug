const merge = require('webpack-merge')
const path = require('path')
const baseWebpackConfig = require('./webpack.config')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

function resolve(dir) {
    return path.join(__dirname, '..', dir)
}

const devConfig = merge(baseWebpackConfig, {
    mode: 'development',

    context: resolve('test'),
    entry: {
        index: './index.js'
    },

    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'index.html',
            inject: 'head'
        }),

        new CopyWebpackPlugin([
            {
                from: 'index.html',
                to: resolve('dist')
            }
        ])
    ],

    devtool: 'source-map',

    devServer: {
        host: 'localhost',
        port: 8088,
        contentBase: 'dist',
        disableHostCheck: true,
        historyApiFallback: true
    }
});

module.exports = devConfig
