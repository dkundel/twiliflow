'use strict';

const Twilio = require('twilio');
const client = new Twilio.IpMessagingClient();
const service = client.services(process.env.TWILIO_IPM_SERVICE_SID);

const BOTS = {
  'giphy': require('./bots/giphy'),
  'commitstrip': require('./bots/commitstrip'),
  'identity': require('./bots/undercover')
}

function handleBotRequests (req, res, next) {
  let threadId = req.body.Body.substr(1, req.body.Body.indexOf(']')-1);
  let content = req.body.Body.substr(req.body.Body.indexOf(']')+1);
  
  console.log(`Content: '${content}'`);
  
  res.status(200).send('');
  if (content.indexOf('/') !== 0) {
    return;
  }
  
  let channel = service.channels(req.body.ChannelSid);
  let endOfCmd = content.indexOf(' ') !== -1 ? content.indexOf(' ') : content.length;
  let botCmd = content.substr(1, endOfCmd - 1);
  let msg = content.substr(endOfCmd + 1);
  
  console.log(`Bot: '${botCmd}', Msg: '${msg}'`);
  console.log(BOTS);
  
  if (typeof BOTS[botCmd] === 'function') {
    BOTS[botCmd](botCmd, msg).then((reply) => {
      channel.members.create({
        identity: reply.from
      }).then((resp) => {
        channel.messages.create({
          from: reply.from,
          body: '['+threadId+']'+reply.body
        }).then((resp) => {
          console.log('SUCCESS!');
        }).catch((err) => {
          console.err('FAILED', err);
        });
      });
    })
  }
  
  
}

module.exports = handleBotRequests;