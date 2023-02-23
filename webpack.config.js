'use strict';

var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');
var { CleanWebpackPlugin } = require('clean-webpack-plugin');

//find cartridge data
var entryFilePath = '';
var outputFile = '';
process.argv.forEach((val, index) => {
    if (val === 'entryFilePath' ) {
        entryFilePath = process.argv[index + 1];
        var pathLength = entryFilePath.split('/').length;
        outputFile = (entryFilePath.split('/')[pathLength-1]).split('.')[0];

        console.log('entryFilePath: ', entryFilePath);
        console.log('pathLength=', pathLength);
        console.log('outputFile:', outputFile);
    }
});
var outputPath = 'cartridges/' + entryFilePath.split('/')[1] + '/cartridge/static/default/';
console.log("outputPath: ", outputPath);

module.exports = [{
    mode: 'production',
    name: 'js',
    entry: path.resolve(__dirname, `./${entryFilePath}`),
    output: {
        path: path.resolve(__dirname, `./${outputPath}js`),
        filename: `${outputFile}.js`
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
    entry: path.resolve(__dirname, `./${entryFilePath}`),
    output: {
        path: path.resolve(__dirname, `./${outputPath}css`),
        filename: `${outputFile}_tmp.tmp`
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
        new MiniCssExtractPlugin({ filename: `${outputFile}.css` }),
        new CleanWebpackPlugin({
            protectWebpackAssets: false,
            cleanAfterEveryBuildPatterns: ['*.tmp']
        })
    ]
}];
