"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.getHTMLpastSSO = void 0;
var totp_generator_1 = require("totp-generator");
var got_1 = require("got"); // solution for ESM
//const fetch = (...args) => import('got').then({default: got} => got(...args));
//const got = await import('got');
var tough_cookie_1 = require("tough-cookie");
var form_data_1 = require("form-data");
var node_html_parser_1 = require("node-html-parser");
var dotenv = require("dotenv");
dotenv.config();
var COOKIE_CACHE = new tough_cookie_1.CookieJar();
var MAX_TRIES = 3;
var OKTA_ENDPOINT = 'https://sso.unimelb.edu.au/api/v1/authn';
var getHTMLpastSSO = function (year, code) { return __awaiter(void 0, void 0, void 0, function () {
    var SWS_URL, html, i, root, endpointSAML, payloadSAML, result;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                SWS_URL = "https://sws.unimelb.edu.au/".concat(year, "/Reports/List.aspx?objects=").concat(code, "&weeks=1-52&days=1-7&periods=1-56&template=module_by_group_list");
                i = 1;
                _c.label = 1;
            case 1:
                if (!(i <= MAX_TRIES)) return [3 /*break*/, 6];
                console.debug('Load timetable attempt #1');
                return [4 /*yield*/, (0, got_1["default"])(SWS_URL, { cookieJar: COOKIE_CACHE }).text()];
            case 2:
                html = _c.sent();
                root = (0, node_html_parser_1.parse)(html);
                endpointSAML = (_a = root.querySelector("form[method=\"POST\"]")) === null || _a === void 0 ? void 0 : _a.getAttribute('action');
                payloadSAML = (_b = root.querySelector("input[name=\"SAMLResponse\"]")) === null || _b === void 0 ? void 0 : _b.getAttribute('value');
                if (!(endpointSAML || payloadSAML)) return [3 /*break*/, 4];
                return [4 /*yield*/, authenticateSAMLAndDownload(endpointSAML, payloadSAML)];
            case 3:
                result = _c.sent();
                COOKIE_CACHE = result.cookies;
                return [2 /*return*/, result.html];
            case 4: return [2 /*return*/, html];
            case 5:
                i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getHTMLpastSSO = getHTMLpastSSO;
var authenticateSAMLAndDownload = function (endpoint, payload) { return __awaiter(void 0, void 0, void 0, function () {
    var SESSION_COOKIES, primaryAuthnData, stateToken, mfaVerifyURL, passCode, mfaAuthnData, sessionToken, formSAML, samlData, root, endpointACS, payloadACS, formACS, webpageHTML;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                SESSION_COOKIES = new tough_cookie_1.CookieJar();
                console.debug('Authenticating username and password');
                return [4 /*yield*/, got_1["default"]
                        .post(OKTA_ENDPOINT, {
                        json: {
                            username: process.env.UOM_USERNAME,
                            password: process.env.UOM_PASSWORD,
                            options: {
                                multiOptionalFactorEnroll: true,
                                warnBeforePasswordExpired: false
                            }
                        },
                        cookieJar: SESSION_COOKIES
                    })
                        .json()];
            case 1:
                primaryAuthnData = _a.sent();
                // check if primary authentication was successful
                if ('errorCode' in primaryAuthnData) {
                    // critical error, exit application
                    console.error('Primary authentication failed with error: \n' + JSON.stringify(primaryAuthnData, null, 2));
                    process.exit(1);
                }
                stateToken = primaryAuthnData['stateToken'];
                mfaVerifyURL = primaryAuthnData['_embedded']['factors'].find(function (e) {
                    e.factorType == 'token:software:totp';
                })['_links']['verify']['href'];
                console.debug('Verifying MFA');
                passCode = (0, totp_generator_1["default"])(process.env.UOM_MFA_SECRET);
                return [4 /*yield*/, got_1["default"]
                        .post(mfaVerifyURL, {
                        json: {
                            stateToken: stateToken,
                            passCode: passCode
                        },
                        cookieJar: SESSION_COOKIES
                    })
                        .json()];
            case 2:
                mfaAuthnData = _a.sent();
                // check if secondary authn was successful
                if ('errorCode' in mfaAuthnData) {
                    console.error('Secondary authentication failed with error: \n' + JSON.stringify(mfaAuthnData, null, 2));
                    process.exit(1);
                }
                sessionToken = mfaAuthnData['sessionToken'];
                console.debug('Authenticated: got session token');
                console.debug('Get ACS details');
                formSAML = new form_data_1["default"]();
                formSAML.append('SAMLRequest', payload);
                return [4 /*yield*/, got_1["default"]
                        .post(endpoint, {
                        body: formSAML,
                        searchParams: { sessionToken: sessionToken },
                        cookieJar: SESSION_COOKIES
                    })
                        .text()];
            case 3:
                samlData = _a.sent();
                root = (0, node_html_parser_1.parse)(samlData);
                endpointACS = root.querySelector("form[method=\"POST\"]").getAttribute('action');
                payloadACS = root.querySelector("input[name=\"SAMLResponse\"]").getAttribute('value');
                console.debug('Downloading webpage through ACS redirect');
                formACS = new form_data_1["default"]();
                formACS.append('SAMLResponse', payloadACS);
                formACS.append('RelayState', '');
                return [4 /*yield*/, got_1["default"].post(endpointACS, { body: formACS, cookieJar: SESSION_COOKIES }).text()];
            case 4:
                webpageHTML = _a.sent();
                return [2 /*return*/, {
                        html: webpageHTML,
                        cookies: SESSION_COOKIES
                    }];
        }
    });
}); };
(0, exports.getHTMLpastSSO)(2023, 'MAST20005').then(function (x) { return console.log(x); });
