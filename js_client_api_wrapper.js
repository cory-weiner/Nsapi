/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/https', 'N/log', 'N/query', 'N/record', 'N/search', 'N/url'],
    /**
 * @param{https} https
 * @param{log} log
 * @param{query} query
 * @param{record} record
 * @param{search} search
 * @param{url} url
 */
    (https, log, query, record, search, url) => {

        const setValues = (target_record, field_obj)=>{
            Object.entries(field_obj).forEach(([key,value])=>{
                if (typeof value == "object"){
                    if (value.type == 'date'){
                        target_record.setValue({
                            fieldId: key,
                            value: new Date(value.value)
                        })
                    }
                    else{
                        target_record.setValue({
                            fieldId: key,
                            value: value.value
                        })
                    }
                }
                else if (value){
                    target_record.setValue({
                        fieldId: key,
                        value: value
                    })
                }
            })
        }


        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            return  "Success Get!"

        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {
            let args = requestBody.args
            switch(requestBody.endpoint) {
                case "query.runSuiteQL":
                    return JSON.stringify(query.runSuiteQL(args).asMappedResults())
                    break;
                case "record.create":
                    let new_rec =  record.create({type: args.type})
                    setValues(new_rec, args.values)
                    return new_rec.save()
                    break;
                default:
                    return "Invalid endpoint specified"
            }
        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => {

        }

        return {get, put, post, delete: doDelete}

    });
