#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const fs = require("fs");
const path = require("path");
const express = require("express");
const graphqlHTTP = require("express-graphql");
const chalk_1 = require("chalk");
const open = require("open");
const cors = require("cors");
const bodyParser = require("body-parser");
const cli_1 = require("./cli");
const proxy_1 = require("./proxy");
const fake_definition_1 = require("./fake_definition");
const utils_1 = require("./utils");
const fake_schema_1 = require("./fake_schema");
const log = console.log;
cli_1.parseCLI((options) => {
    const { extendURL, headers, forwardHeaders } = options;
    const fileName = options.fileName ||
        (extendURL ? './schema_extension.faker.graphql' : './schema.faker.graphql');
    if (!options.fileName) {
        log(chalk_1.default.yellow(`Default file ${chalk_1.default.magenta(fileName)} is used. ` +
            `Specify [file] parameter to change.`));
    }
    let userSDL = utils_1.existsSync(fileName) && utils_1.readSDL(fileName);
    if (extendURL) { // run in proxy mode
        utils_1.getRemoteSchema(extendURL, headers)
            .then(schema => {
            const remoteSDL = new graphql_1.Source(graphql_1.printSchema(schema), `Inrospection from "${extendURL}"`);
            if (!userSDL) {
                let body = fs.readFileSync(path.join(__dirname, 'default-extend.graphql'), 'utf-8');
                const rootTypeName = schema.getQueryType().name;
                body = body.replace('<RootTypeName>', rootTypeName);
                userSDL = new graphql_1.Source(body, fileName);
            }
            const executeFn = proxy_1.getProxyExecuteFn(extendURL, headers, forwardHeaders);
            runServer(options, userSDL, remoteSDL, executeFn);
        })
            .catch(error => {
            log(chalk_1.default.red(error.stack));
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
    const { useHttps, tlsKeyFile, tlsCert } = options;
    var protocol;
    if (useHttps) {
        var https = require('https');
        var fs = require('fs');
        var https_options = {
            key: fs.readFileSync(tlsKeyFile),
            cert: fs.readFileSync(tlsCert)
        };
        protocol = 'https';
    }
    else {
        protocol = 'http';
    }
    const { port, openEditor, hostname } = options;
    const corsOptions = {
        credentials: true,
        origin: options.corsOrigin,
    };
    const app = express();
    app.options('/graphql', cors(corsOptions));
    app.use('/graphql', cors(corsOptions), graphqlHTTP(() => ({
        schema: remoteSDL ? buildSchema(remoteSDL, userSDL) : buildSchema(userSDL),
        typeResolver: fake_schema_1.fakeTypeResolver,
        fieldResolver: fake_schema_1.fakeFieldResolver,
        customExecuteFn,
        graphiql: true,
    })));
    app.get('/user-sdl', (_, res) => {
        res.status(200).json({
            userSDL: userSDL.body,
            remoteSDL: remoteSDL && remoteSDL.body,
        });
    });
    app.use('/user-sdl', bodyParser.text({ limit: '8mb' }));
    app.post('/user-sdl', (req, res) => {
        try {
            const fileName = userSDL.name;
            fs.writeFileSync(fileName, req.body);
            userSDL = new graphql_1.Source(req.body, fileName);
            const date = (new Date()).toLocaleString();
            log(`${chalk_1.default.green('✚')} schema saved to ${chalk_1.default.magenta(fileName)} on ${date}`);
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
    const shutdown = () => {
        server.close();
        process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    log(`\n${chalk_1.default.green('✔')} Your GraphQL Fake API is ready to use 🚀
  Here are your links:

  ${chalk_1.default.blue('❯')} Interactive Editor: ${protocol}://${hostname}:${port}/editor
  ${chalk_1.default.blue('❯')} GraphQL API:        ${protocol}://${hostname}:${port}/graphql

  `);
    if (openEditor) {
        setTimeout(() => open(`${protocol}://${hostname}:${port}/editor`), 500);
    }
}
function buildSchema(schemaSDL, extendSDL) {
    let schemaAST = graphql_1.parse(schemaSDL);
    let schema = graphql_1.buildASTSchema(fake_definition_1.mergeWithFakeDefinitions(schemaAST));
    if (extendSDL) {
        schema = graphql_1.extendSchema(schema, graphql_1.parse(extendSDL));
        // FIXME: put in field extensions
        for (const type of Object.values(schema.getTypeMap())) {
            if (graphql_1.isObjectType(type) || graphql_1.isInterfaceType(type)) {
                for (const field of Object.values(type.getFields())) {
                    const node = field.astNode;
                    if (node && node.loc && node.loc.source === extendSDL) {
                        field.isExtensionField = true;
                    }
                }
            }
        }
    }
    return schema;
}
//# sourceMappingURL=index.js.map