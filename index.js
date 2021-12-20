
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

        this.runtime = {
            getCurrentUser: () =>{
                return this.makeRequest({endpoint: "runtime.getCurrentUser"}) 
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


    fileToBase64(file){
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = error => reject(error);
      })
    }
    
    makeRequest({endpoint, args}){
        let file_promises = []
        if (args.values){
            args.values.forEach(v=>{
                if (typeof v == 'object' && v.type == 'file'){
                    let file_process_promise = this.fileToBase64(v.value).then(base64_data=>{
                        v.value = base64_data.slice(base64_data.indexOf(",")+1)
                    })
                    file_promises.push(file_process_promise)
                }
            })
        }

        
        return Promise.all(file_promises).then(all_promises=>{
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
    
        })

    }


}

module.exports = Nsapi