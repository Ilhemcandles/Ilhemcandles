const basejoi = require('joi');
const sanitizeHTML = require('sanitize-html')
const extension = (joi) => ({
    type: 'string',
    base: joi.string(),
    messages: {
        'string.escapeHTML': '{{#label}} must not include HTML'
    },
    rules: {
        escapedHTML: {
            validate(value, helpers) {
                const clean = sanitizeHTML(value, {
                    allowedTags: [],
                    allowedAttributes: {}
                });
                if (clean !== value) return helpers.error('strring.escapedHTML', { value })
                return clean;
            }
        }
    }
})
const joi = basejoi.extend(extension)
module.exports.validateschema = joi.object({
    user: joi.object({
        firstname: joi.string().required().min(1).escapedHTML(),
        firstname: joi.string().required().min(1).escapedHTML(),
        email: joi.string().required().min(1).escapedHTML(),
        Phone: joi.number().required().min(7),
        username: joi.string().required().min(8).escapedHTML(),
        password: joi.string().required().min(8).escapedHTML()

    }).required()
})
module.exports.cartSchema = joi.object({
    cart: joi.object({
        title: joi.string().required().escapedHTML(),
        username: joi.string().required().escapedHTML(),
        categorie: joi.string().required().escapedHTML()


    }).required()

});