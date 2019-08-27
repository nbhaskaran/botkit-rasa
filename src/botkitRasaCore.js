const request = require('request-promise')
const debug = require('debug')('botkit:rasa')

module.exports = config => {
  if (!config) {
    config = {}
  }

  if (!config.rasa_uri) {
    config.rasa_uri = 'http://localhost:5000'
  }

  var middleware = {
    receive: (bot, message, next) => {
      if (!message.text || message.is_echo) {
        next()
        return
      }

      debug('Sending message to Rasa', message.text)
      const options = {
        method: 'POST',
        uri: `${config.rasa_uri}/conversations/default/respond`,
        body: {
          query: message.text
        },
        json: true
      }

      request(options)
        .then(response => {
          debug('Rasa response', response)
          if(response && response[0]) {
            var coreResponse = JSON.stringify(response[0])
            var parsedResponse = JSON.parse(coreResponse)
            message.recipient_id = response.recipient_id
            message.text = response.text
          }
          else {
            message.recipient_id = 'default'
            message.text = 'Sorry, the bot could not parse the response'
          }
          next()
        })
    },

    hears: (patterns, message) => {
      return patterns.some(pattern => {
        if (message.recipient_id === 'default') {
          debug('Rasa core response matched the recipient id', message.recipient_id, pattern)
          return true
        }
      })
    }

  }
  return middleware
}
