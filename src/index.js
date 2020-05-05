#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var graphql_1 = require("graphql");
var fs = require("fs");
var path = require("path");
var express = require("express");
var graphqlHTTP = require("express-graphql");
var chalk_1 = require("chalk");
var open = require("open");
var cors = require("cors");
var bodyParser = require("body-parser");
var cli_1 = require("./cli");
var proxy_1 = require("./proxy");
var fake_definition_1 = require("./fake_definition");
var utils_1 = require("./utils");
var fake_schema_1 = require("./fake_schema");
var log = console.log;
cli_1.parseCLI(function (options) {
    var extendURL = options.extendURL, headers = options.headers, forwardHeaders = options.forwardHeaders;
    var fileName = options.fileName ||
        (extendURL ? './schema_extension.faker.graphql' : './schema.faker.graphql');
    if (!options.fileName) {
        log(chalk_1["default"].yellow("Default file " + chalk_1["default"].magenta(fileName) + " is used. " +
            "Specify [file] parameter to change."));
    }
    var userSDL = utils_1.existsSync(fileName) && utils_1.readSDL(fileName);
    if (extendURL) { // run in proxy mode
        utils_1.getRemoteSchema(extendURL, headers)
            .then(function (schema) {
            var remoteSDL = new graphql_1.Source(graphql_1.printSchema(schema), "Inrospection from \"" + extendURL + "\"");
            if (!userSDL) {
                var body = fs.readFileSync(path.join(__dirname, 'default-extend.graphql'), 'utf-8');
                var rootTypeName = schema.getQueryType().name;
                body = body.replace('<RootTypeName>', rootTypeName);
                userSDL = new graphql_1.Source(body, fileName);
            }
            var executeFn = proxy_1.getProxyExecuteFn(extendURL, headers, forwardHeaders);
            runServer(options, userSDL, remoteSDL, executeFn);
        })["catch"](function (error) {
            log(chalk_1["default"].red(error.stack));
            process.exit(1);
        });
    }
    else {
        if (!userSDL) {
            userSDL = new graphql_1.Source(fs.readFileSync(path.join(__dirname, 'default-schema.graphql'), 'utf-8'), fileName);
        }
        runServer(options, userSDL);
    }
});
function runServer(options, userSDL, remoteSDL, customExecuteFn) {
    // Adding CLI params for HTTPS
    var useHttps = options.useHttps, tlsKeyFile = options.tlsKeyFile, tlsCert = options.tlsCert, tlsCaCert = options.tlsCaCert;
    var protocol;
    if (useHttps) {
        var https = require('https');
        var fs = require('fs');
        var https_options = {
            key: fs.readFileSync(tlsKeyFile),
            cert: fs.readFileSync(tlsCert),
            ca: [
                fs.readFileSync(String(tlsCaCert)),
            ]
        };
        protocol = 'https';
    }
    else {
        protocol = 'http';
    }
    var port = options.port, openEditor = options.openEditor, hostname = options.hostname;
    var corsOptions = {
        credentials: true,
        origin: options.corsOrigin
    };
    var app = express();
    app.options('/graphql', cors(corsOptions));
    app.use('/graphql', cors(corsOptions), graphqlHTTP(function () { return ({
        schema: remoteSDL ? buildSchema(remoteSDL, userSDL) : buildSchema(userSDL),
        typeResolver: fake_schema_1.fakeTypeResolver,
        fieldResolver: fake_schema_1.fakeFieldResolver,
        customExecuteFn: customExecuteFn,
        graphiql: true
    }); }));
    app.get('/user-sdl', function (_, res) {
        res.status(200).json({
            userSDL: userSDL.body,
            remoteSDL: remoteSDL && remoteSDL.body
        });
    });
    app.use('/user-sdl', bodyParser.text({ limit: '8mb' }));
    app.post('/user-sdl', function (req, res) {
        try {
            var fileName = userSDL.name;
            fs.writeFileSync(fileName, req.body);
            userSDL = new graphql_1.Source(req.body, fileName);
            var date = (new Date()).toLocaleString();
            log(chalk_1["default"].green('✚') + " schema saved to " + chalk_1["default"].magenta(fileName) + " on " + date);
            res.status(200).send('ok');
        }
        catch (err) {
            res.status(500).send(err.message);
        }
    });
    app.use('/editor', express.static(path.join(__dirname, 'editor')));
    // launch server w/ HTTPS options
    var server;
    if (useHttps) {
        server = https.createServer(https_options, app).listen(port);
    }
    else {
        server = app.listen(port);
    }
    var shutdown = function () {
        server.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    log("\n" + chalk_1["default"].green('✔') + " Your GraphQL Fake API is ready to use \uD83D\uDE80\n  Here are your links:\n\n  " + chalk_1["default"].blue('❯') + " Interactive Editor: " + protocol + "://" + hostname + ":" + port + "/editor\n  " + chalk_1["default"].blue('❯') + " GraphQL API:        " + protocol + "://" + hostname + ":" + port + "/graphql\n\n  ");
    if (openEditor) {
        setTimeout(function () { return open(protocol + "://" + hostname + ":" + port + "/editor"); }, 500);
    }
}
function buildSchema(schemaSDL, extendSDL) {
    var schemaAST = graphql_1.parse(schemaSDL);
    var schema = graphql_1.buildASTSchema(fake_definition_1.mergeWithFakeDefinitions(schemaAST));
    if (extendSDL) {
        schema = graphql_1.extendSchema(schema, graphql_1.parse(extendSDL));
        // FIXME: put in field extensions
        for (var _i = 0, _a = Object.values(schema.getTypeMap()); _i < _a.length; _i++) {
            var type = _a[_i];
            if (graphql_1.isObjectType(type) || graphql_1.isInterfaceType(type)) {
                for (var _b = 0, _c = Object.values(type.getFields()); _b < _c.length; _b++) {
                    var field = _c[_b];
                    var node = field.astNode;
                    if (node && node.loc && node.loc.source === extendSDL) {
                        field.isExtensionField = true;
                    }
                }
            }
        }
    }
    return schema;
}
