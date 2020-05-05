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
exports.mergeWithFakeDefinitions = void 0;
var graphql_1 = require("graphql");
var fakeDefinitionAST = graphql_1.parse("\nenum fake__Locale {\n  az\n  cz\n  de\n  de_AT\n  de_CH\n  en\n  en_AU\n  en_BORK\n  en_CA\n  en_GB\n  en_IE\n  en_IND\n  en_US\n  en_au_ocker\n  es\n  es_MX\n  fa\n  fr\n  fr_CA\n  ge\n  id_ID\n  it\n  ja\n  ko\n  nb_NO\n  nep\n  nl\n  pl\n  pt_BR\n  ru\n  sk\n  sv\n  tr\n  uk\n  vi\n  zh_CN\n  zh_TW\n}\n\nenum fake__Types {\n  zipCode\n  city\n  streetName\n  \"Configure address with option `useFullAddress`\"\n  streetAddress\n  secondaryAddress\n  county\n  country\n  countryCode\n  state\n  stateAbbr\n  latitude\n  longitude\n\n  colorName\n  productCategory\n  productName\n  \"Sum of money. Configure with options `minMoney`/`maxMoney` and 'decimalPlaces'.\"\n  money\n  productMaterial\n  product\n\n  companyName\n  companyCatchPhrase\n  companyBS\n\n  dbColumn\n  dbType\n  dbCollation\n  dbEngine\n\n  \"Configure date format with option `dateFormat`\"\n  pastDate\n  \"Configure date format with option `dateFormat`\"\n  futureDate\n  \"Configure date format with option `dateFormat`\"\n  recentDate\n\n  financeAccountName\n  financeTransactionType\n  currencyCode\n  currencyName\n  currencySymbol\n  bitcoinAddress\n  internationalBankAccountNumber\n  bankIdentifierCode\n\n  hackerAbbr\n  hackerPhrase\n\n  \"An image url. Configure image with options: `imageCategory`, `imageWidth`, `imageHeight` and `randomizeImageUrl`\"\n  imageUrl\n  \"An URL for an avatar\"\n  avatarUrl\n  \"Configure email provider with option: `emailProvider`\"\n  email\n  url\n  domainName\n  ipv4Address\n  ipv6Address\n  userAgent\n  \"Configure color with option: `baseColor`\"\n  colorHex\n  macAddress\n  \"Configure password with option `passwordLength`\"\n  password\n\n  \"Lorem Ipsum text. Configure size with option `loremSize`\"\n  lorem\n\n  firstName\n  lastName\n  fullName\n  jobTitle\n\n  phoneNumber\n\n  number\n  uuid\n  word\n  words\n  locale\n\n  filename\n  mimeType\n  fileExtension\n  semver\n}\n\nenum fake__imageCategory {\n  abstract\n  animals\n  business\n  cats\n  city\n  food\n  nightlife\n  fashion\n  people\n  nature\n  sports\n  technics\n  transport\n}\n\nenum fake__loremSize {\n  word\n  words\n  sentence\n  sentences\n  paragraph\n  paragraphs\n}\n\ninput fake__color {\n  red255: Int = 0\n  green255: Int = 0\n  blue255: Int = 0\n}\n\ninput fake__options {\n  \"Only for type `streetAddress`\"\n  useFullAddress: Boolean\n  \"Only for type `money`\"\n  minMoney: Float\n  \"Only for type `money`\"\n  maxMoney: Float\n  \"Only for type `money`\"\n  decimalPlaces: Int\n  \"Only for type `imageUrl`\"\n  imageWidth: Int\n  \"Only for type `imageUrl`\"\n  imageHeight: Int\n  \"Only for type `imageUrl`\"\n  imageCategory: fake__imageCategory\n  \"Only for type `imageUrl`\"\n  randomizeImageUrl: Boolean\n  \"Only for type `email`\"\n  emailProvider: String\n  \"Only for type `password`\"\n  passwordLength: Int\n  \"Only for type `lorem`\"\n  loremSize: fake__loremSize\n  \"Only for types `*Date`. Example value: `YYYY MM DD`. [Full Specification](http://momentjs.com/docs/#/displaying/format/)\"\n  dateFormat: String\n  \"Only for type `colorHex`. [Details here](https://stackoverflow.com/a/43235/4989887)\"\n  baseColor: fake__color = { red255: 0, green255: 0, blue255: 0 }\n  \"Only for type `number`\"\n  minNumber: Float\n  \"Only for type `number`\"\n  maxNumber: Float\n  \"Only for type `number`\"\n  precisionNumber: Float\n}\n\ndirective @fake(type:fake__Types!, options: fake__options = {}, locale:fake__Locale) on FIELD_DEFINITION | SCALAR\n\ndirective @listLength(min: Int!, max: Int!) on FIELD_DEFINITION\n\nscalar examples__JSON\ndirective @examples(values: [examples__JSON]!) on FIELD_DEFINITION | SCALAR\n");
function defToName(defNode) {
    var kind = defNode.kind, name = defNode.name;
    if (name == null) {
        return '';
    }
    return (kind === graphql_1.Kind.DIRECTIVE_DEFINITION ? '@' : '') + name.value;
}
var fakeDefinitionsSet = new Set(fakeDefinitionAST.definitions.map(defToName));
function mergeWithFakeDefinitions(schemaAST) {
    // Remove Faker's own definitions that were added to have valid SDL for other
    // tools, see: https://github.com/APIs-guru/graphql-faker/issues/75
    var filteredAST = __assign(__assign({}, schemaAST), { definitions: schemaAST.definitions.filter(function (def) {
            var name = defToName(def);
            return name === '' || !fakeDefinitionsSet.has(name);
        }) });
    return graphql_1.concatAST([filteredAST, fakeDefinitionAST]);
}
exports.mergeWithFakeDefinitions = mergeWithFakeDefinitions;
