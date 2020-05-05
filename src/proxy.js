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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.getProxyExecuteFn = void 0;
var graphql_1 = require("graphql");
var utils_1 = require("./utils");
function getProxyExecuteFn(url, headers, forwardHeaders) {
    //TODO: proxy extensions
    return function (args) {
        var schema = args.schema, document = args.document, contextValue = args.contextValue, operationName = args.operationName;
        var request = contextValue;
        var proxyHeaders = Object.create(null);
        for (var _i = 0, forwardHeaders_1 = forwardHeaders; _i < forwardHeaders_1.length; _i++) {
            var name_1 = forwardHeaders_1[_i];
            proxyHeaders[name_1] = request.headers[name_1];
        }
        var strippedAST = removeUnusedVariables(stripExtensionFields(schema, document));
        var operations = graphql_1.separateOperations(strippedAST);
        var operationAST = operationName
            ? operations[operationName]
            : Object.values(operations)[0];
        return utils_1.graphqlRequest(url, __assign(__assign({}, headers), proxyHeaders), graphql_1.print(operationAST), args.variableValues, operationName).then(function (result) { return proxyResponse(result, args); });
    };
}
exports.getProxyExecuteFn = getProxyExecuteFn;
function proxyResponse(response, args) {
    var rootValue = response.data || {};
    var globalErrors = [];
    for (var _i = 0, _a = (response.errors || []); _i < _a.length; _i++) {
        var error = _a[_i];
        var message = error.message, path = error.path, extensions = error.extensions;
        var errorObj = new graphql_1.GraphQLError(message, undefined, undefined, undefined, path, undefined, extensions);
        if (!path) {
            globalErrors.push(errorObj);
            continue;
        }
        // Recreate root value up to a place where original error was thrown
        // and place error as field value.
        pathSet(rootValue, error.path, errorObj);
    }
    if (globalErrors.length !== 0) {
        return { errors: globalErrors };
    }
    return graphql_1.execute(__assign(__assign({}, args), { rootValue: rootValue }));
}
function pathSet(rootObject, path, value) {
    var currentObject = rootObject;
    var basePath = __spreadArrays(path);
    var lastKey = basePath.pop();
    for (var _i = 0, basePath_1 = basePath; _i < basePath_1.length; _i++) {
        var key = basePath_1[_i];
        if (currentObject[key] == null) {
            currentObject[key] = typeof key === 'number' ? [] : {};
        }
        currentObject = currentObject[key];
    }
    currentObject[lastKey] = value;
}
function injectTypename(node) {
    return __assign(__assign({}, node), { selections: __spreadArrays(node.selections, [
            {
                kind: graphql_1.Kind.FIELD,
                name: {
                    kind: graphql_1.Kind.NAME,
                    value: '__typename'
                }
            },
        ]) });
}
function stripExtensionFields(schema, operationAST) {
    var _a;
    var typeInfo = new graphql_1.TypeInfo(schema);
    return graphql_1.visit(operationAST, graphql_1.visitWithTypeInfo(typeInfo, (_a = {},
        _a[graphql_1.Kind.FIELD] = function () {
            var fieldDef = typeInfo.getFieldDef();
            if (fieldDef.name.startsWith('__') || fieldDef.isExtensionField)
                return null;
        },
        _a[graphql_1.Kind.SELECTION_SET] = {
            leave: function (node) {
                var type = typeInfo.getParentType();
                if (graphql_1.isAbstractType(type) || node.selections.length === 0)
                    return injectTypename(node);
            }
        },
        _a)));
}
function removeUnusedVariables(documentAST) {
    var _a, _b;
    var seenVariables = Object.create(null);
    graphql_1.visit(documentAST, (_a = {},
        _a[graphql_1.Kind.VARIABLE_DEFINITION] = function () { return false; },
        _a[graphql_1.Kind.VARIABLE] = function (node) {
            seenVariables[node.name.value] = true;
        },
        _a));
    return graphql_1.visit(documentAST, (_b = {},
        _b[graphql_1.Kind.VARIABLE_DEFINITION] = function (node) {
            if (!seenVariables[node.variable.name.value]) {
                return null;
            }
        },
        _b));
}
