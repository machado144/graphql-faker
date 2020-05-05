"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.graphqlRequest = exports.getRemoteSchema = exports.readSDL = exports.existsSync = void 0;
var fs = require("fs");
var node_fetch_1 = require("node-fetch");
var node_fetch_2 = require("node-fetch");
var graphql_1 = require("graphql");
function existsSync(filePath) {
    try {
        fs.statSync(filePath);
    }
    catch (err) {
        if (err.code == 'ENOENT')
            return false;
    }
    return true;
}
exports.existsSync = existsSync;
function readSDL(filepath) {
    return new graphql_1.Source(fs.readFileSync(filepath, 'utf-8'), filepath);
}
exports.readSDL = readSDL;
function getRemoteSchema(url, headers) {
    return graphqlRequest(url, headers, graphql_1.getIntrospectionQuery())
        .then(function (response) {
        if (response.errors) {
            throw Error(JSON.stringify(response.errors, null, 2));
        }
        return graphql_1.buildClientSchema(response.data);
    })["catch"](function (error) {
        throw Error("Can't get introspection from " + url + ":\n" + error.message);
    });
}
exports.getRemoteSchema = getRemoteSchema;
function graphqlRequest(url, headers, query, variables, operationName) {
    return node_fetch_1["default"](url, {
        method: 'POST',
        headers: new node_fetch_2.Headers(__assign({ "content-type": 'application/json' }, (headers || {}))),
        body: JSON.stringify({
            operationName: operationName,
            query: query,
            variables: variables
        })
    }).then(function (responce) {
        if (responce.ok)
            return responce.json();
        return responce.text().then(function (body) {
            throw Error(responce.status + " " + responce.statusText + "\n" + body);
        });
    });
}
exports.graphqlRequest = graphqlRequest;
