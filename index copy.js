const crypto = require('crypto');
const oauth1a = require('oauth-1.0a');
const axios = require('axios')
const Compress = require('compress.js')
const compress = new Compress.default()

// DO NOT CHANGE ON FIELD APP -- NEED TO IMPLEMENT PROXY!


const api = axios.create({})
// Rate limit requests from axios on dev environment
const MAX_REQUESTS_COUNT = 3
const INTERVAL_MS = 500
let PENDING_REQUESTS = 0


class Nsapi {
    constructor({
        ENVIRONMENT,
        CONSUMERKEY,
        CONSUMERSECRET,
        TOKENKEY,
        TOKENSECRET,
        REALM
    }) {

        ENVIRONMENT
        this.batch = false
        this.CONSUMERKEY = CONSUMERKEY
        this.CONSUMERSECRET = CONSUMERSECRET
        this.TOKENKEY = TOKENKEY
        this.TOKENSECRET = TOKENSECRET
        this.REALM = REALM
        if (REALM) {
            // Axios request interceptor - throttles request on dev environment
            api.interceptors.request.use(function (config) {

                return new Promise((resolve, reject) => {
                    let interval = setInterval(() => {
                        if (PENDING_REQUESTS < MAX_REQUESTS_COUNT) {
                            PENDING_REQUESTS++
                            clearInterval(interval)
                            resolve(config)
                        }
                        else {
                            console.log("Hit maximum concurrency - delaying request")
                        }
                    }, INTERVAL_MS)
                })
            })
            /**
             * Axios Response Interceptor
             */
            api.interceptors.response.use(function (response) {

                PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
                return Promise.resolve(response)
            }, function (error) {
                PENDING_REQUESTS = Math.max(0, PENDING_REQUESTS - 1)
                return Promise.reject(error)
            })

            this.API_URL = `https://${REALM.toString().replace('_SB', '-sb')}.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=customscript_js_client_api_wrapper&deploy=customdeploy_client_api_wrap`
        }
        else {
            this.API_URL = `/app/site/hosting/restlet.nl?script=customscript_js_client_api_wrapper&deploy=customdeploy_client_api_wrap`
        }

        this.query = {
            runSuiteQL: (args) => {
                let req = { endpoint: "query.runSuiteQL", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            },

        }

        this.task = {
            create: (args) => {
                let req = { endpoint: "task.create", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            }
        }

        this.batch = {
            run: (requests) => {
                return this.makeRequest({ batch: requests })
            }
        }

        this.https = {
            get: (args) => {
                let req = { endpoint: "https.get", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            },
            post: (args) => {
                let req = { endpoint: "https.post", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            },
            put: (args) => {
                let req = { endpoint: "https.put", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            }
        }

        // Args - should be provided a type and values object.
        this.record = {
            create: (args) => {
                let req = { endpoint: "record.create", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            },
            submitFields: (args) => {
                let req = { endpoint: "record.submitFields", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            },
            delete: (args) => {
                let req = { endpoint: "record.delete", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            }
        }

        this.runtime = {
            getCurrentUser: (args) => {
                let req = { endpoint: "runtime.getCurrentUser" }
                if (args && args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            }
        }
        this.search = {
            create: (args) => {
                let req = { endpoint: "search.create", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            },
            load: (args) => {
                let req = { endpoint: "search.load", args }
                if (args.batchid) {
                    return req
                }
                return this.makeRequest(req)
            }
        }


        this.fileEncodeTypes = {
            "data:image/png;base64,": "PNGIMAGE",
            "data:text/csv;base64,": "CSV",
            "data:application/vnd.ms-excel;base64,": "EXCEL",
            "data:application/pdf;base64,": "PDF",
            "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,": "WORD",
            "data:image/jpeg;base64,": "JPGIMAGE",
            "data:text/plain;base64,": "PLAINTEXT"
        }

        this.getAuthToken = (request) => {
            return this.getAuthHeaderForRequest(request)
        }



    }

    getAuthHeaderForRequest(request) {

        const oauth = oauth1a({
            consumer: { key: this.CONSUMERKEY, secret: this.CONSUMERSECRET },
            realm: this.REALM,
            signature_method: 'HMAC-SHA256',
            hash_function(base_string, key) {
                return crypto
                    .createHmac('sha256', key)
                    .update(base_string)
                    .digest('base64')
            },
        })

        const authorization = oauth.authorize(request, {
            key: this.TOKENKEY,
            secret: this.TOKENSECRET,
        });

        return oauth.toHeader(authorization);
    }


    fileToBase64(file, compressionoptions = undefined) {
        if (compressionoptions) {
            return compress.compress([file], compressionoptions).then(result => {
                console.log("got the result in lib", result)
                return {
                    value: result[0].data,
                    fileType: this.fileEncodeTypes[result[0].prefix]
                }
            })
        }
        return new Promise((resolve, reject) => {

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(
                {
                    value: reader.result.slice(reader.result.indexOf(",") + 1),
                    fileType: this.fileEncodeTypes[reader.result.slice(0, reader.result.indexOf(",") + 1)]
                }
            );
            reader.onerror = error => reject(error);
        })
    }


    makeRequest({ endpoint, args, batch }) {
        console.log("got to makeRequest", args)

        var config = {
            method: 'POST',
            url: this.API_URL,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (this.TOKENKEY) {
            config.headers.Authorization = this.getAuthHeaderForRequest(config).Authorization
        }

        if (batch) {
            config.data = {
                batch
            }
        }
        else {
            config.data = {
                endpoint,
                args
            }
        }


        console.log(config)

        return new Promise((resolve, reject) => {
            return api(config).then(function (response) {
                console.log("response")
                resolve(response.data)
            }).catch(error => {
                console.log(error)
                reject(error.response)
            })
        })



    }


}

module.exports = Nsapi