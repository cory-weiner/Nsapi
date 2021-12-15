
// const { request } = require('http');
const crypto = require('crypto');
const oauth1a = require('oauth-1.0a');
const axios = require('axios')

class Nsapi{
    constructor({
        ENVIRONMENT,
        CONSUMERKEY,
        CONSUMERSECRET,
        TOKENKEY,
        TOKENSECRET,
        REALM
    }) {
        
        this.CONSUMERKEY = CONSUMERKEY
        this.CONSUMERSECRET = CONSUMERSECRET
        this.TOKENKEY = TOKENKEY
        this.TOKENSECRET = TOKENSECRET
        this.REALM = REALM 
        if (REALM){
          
            this.API_URL = `https://${REALM.toString().replace('_SB','-sb')}.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=customscript_js_client_api_wrapper&deploy=customdeploy_client_api_wrap`
        }
        else{
            this.API_URL = `/app/site/hosting/restlet.nl?script=customscript_js_client_api_wrapper&deploy=customdeploy_client_api_wrap`
        }

        this.query = {
            runSuiteQL: (args) =>{
                return this.makeRequest({endpoint: "query.runSuiteQL", args})
            }
        }
    
        // Args - should be provided a type and values object.
        this.record = {
            create: (args) =>{
                return this.makeRequest({endpoint: "record.create", args}) 
            }
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

    makeRequest({endpoint, args}){

        var config = {
            method: 'POST',
            url: this.API_URL,
            headers: { 
              'Content-Type': 'application/json', 
            }
          };
          
          if (this.TOKENKEY){
            config.headers.Authorization = this.getAuthHeaderForRequest(config).Authorization
          }
          

          config.data = {
              endpoint,
              args
          }
    
          return axios(config)
          .then(function (response) {
        
        
            return response.data
          })
          .catch(function (error) {
            console.log(error.response.data.error);
          });

    }


}

module.exports = Nsapi