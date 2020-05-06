"use strict";
exports.__esModule = true;
exports.parseCLI = void 0;
var yargs = require("yargs");
function builder(cmd) {
    return cmd
        .positional('SDLFile', {
        describe: 'path to file with SDL. If this argument is omitted Faker uses default file name',
        type: 'string',
        nargs: 1
    })
        .options({
        'port': {
            alias: 'p',
            describe: 'HTTP Port',
            type: 'number',
            requiresArg: true,
            "default": process.env.PORT || 9002
        },
        // Start of CLI params for HTTPS		
        'hostname': {
            alias: 'ho',
            describe: 'Host/Server Name',
            type: 'string',
            requiresArg: true,
            "default": process.env.GQLF_HOSTNAME || 'localhost'
        },
        'tlskeyfile': {
            alias: 'tk',
            describe: 'Path to the private key file for the TLS certificate',
            type: 'string',
            requiresArg: true,
            "default": process.env.GQLF_KEY || "missing"
        },
        'tlscert': {
            alias: 'tc',
            describe: 'Path to the TLS certificate file',
            type: 'string',
            requiresArg: true,
            "default": process.env.GQLF_CERT || "missing"
        },
        'https': {
            alias: 's',
            describe: 'Use TLS encryption. Requires key, cert, and cacert.',
            type: 'boolean',
            "default": process.env.GQLF_HTTPS || false
        },
        // End of CLI params for HTTPS
        'open': {
            alias: 'o',
            describe: 'Open page with SDL editor and GraphiQL in browser',
            type: 'boolean'
        },
        'cors-origin': {
            alias: 'co',
            describe: 'CORS: Specify the custom origin for the Access-Control-Allow-Origin header, by default it is the same as `Origin` header from the request',
            type: 'string',
            requiresArg: true,
            "default": true
        },
        'extend': {
            alias: 'e',
            describe: 'URL to existing GraphQL server to extend',
            type: 'string',
            requiresArg: true
        },
        'header': {
            alias: 'H',
            describe: 'Specify headers to the proxied server in cURL format, e.g.: "Authorization: bearer XXXXXXXXX"',
            array: true,
            type: 'string',
            requiresArg: true,
            implies: 'extend',
            coerce: function (arr) {
                var headers = {};
                for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                    var str = arr_1[_i];
                    var _a = str.match(/(.*?):(.*)/), name_1 = _a[1], value = _a[2];
                    headers[name_1.toLowerCase()] = value.trim();
                }
                return headers;
            }
        },
        'forward-headers': {
            describe: 'Specify which headers should be forwarded to the proxied server',
            array: true,
            type: 'string',
            implies: 'extend',
            coerce: function (arr) {
                return arr.map(function (str) { return str.toLowerCase(); });
            }
        }
    })
        .epilog(epilog)
        .strict();
}
function parseCLI(commandCB) {
    yargs
        .usage('$0 [SDLFile]', '', builder, handler)
        .help('h')
        .alias('h', 'help')
        .argv;
    function handler(argv) {
        commandCB({
            fileName: argv.SDLFile,
            port: argv.port,
            // https params
            hostname: argv.hostname,
            tlsKeyFile: argv['tlskeyfile'],
            tlsCert: argv['tlscert'],
            useHttps: argv.https,
            corsOrigin: argv['cors-origin'],
            openEditor: argv.open,
            extendURL: argv.extend,
            headers: argv.header || {},
            forwardHeaders: argv.forwardHeaders || []
        });
    }
}
exports.parseCLI = parseCLI;
var epilog = "Examples:\n\n# Mock GraphQL API based on example SDL and open interactive editor\n$0 --open\n\n# Extend real data from SWAPI with faked data based on extension SDL\n$0 ./ext-swapi.grqphql --extend http://swapi.apis.guru/\n\n# Extend real data from GitHub API with faked data based on extension SDL\n$0 ./ext-gh.graphql --extend https://api.github.com/graphql \\\n--header \"Authorization: bearer <TOKEN>\"";
