'use strict';

var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var jsFiles = require('sgmf-scripts').createJsPath();
var scssFiles = require('sgmf-scripts').createScssPath();

module.exports = [{
    mode: 'production',
    name: 'js',
    entry: jsFiles,
    output: {
        path: path.resolve('./cartridges/int_bolt_sfra/cartridge/static'),
        filename: '[name].js'
    },
    module: {
        rules: [
            {
                test: /bootstrap(.)*\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/env'],
                        plugins: ['@babel/plugin-proposal-object-rest-spread'],
                        cacheDirectory: true
                    }
                }
            }
        ]
    }
},
{
    mode: 'production',
    name: 'scss',
    entry: scssFiles,
    output: {
        path: path.resolve('./cartridges/int_bolt_sfra/cartridge/static'),
        filename: '[name]_tmp.css'
    },
    module: {
        rules: [{
            test: /\.scss$/,
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        url: false
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: {
                            plugins: [
                                ['autoprefixer', {}]
                            ]
                        }
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [
                            path.resolve('node_modules')
                        ]
                    }
                }
            ]
        }]
    },
    plugins: [
        new MiniCssExtractPlugin({ filename: '[name].css' })
    ]
}];
