module.exports = {};
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');
const azure = require('@azure/identity');
const graph = require('@microsoft/microsoft-graph-client');
const authProviders =
  require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');

let _settings = undefined;
let _deviceCodeCredential = undefined;
let _userClient = undefined;




function initializeGraphForUserAuth(settings, deviceCodePrompt) {
  // Ensure settings isn't null
  if (!settings) {
    throw new Error('Settings cannot be undefined');
  }

  _settings = settings;


  _deviceCodeCredential = new azure.DeviceCodeCredential({
    clientId: settings.clientId,
    tenantId: settings.tenantId,
    userPromptCallback: deviceCodePrompt
  });

  const authProvider = new authProviders.TokenCredentialAuthenticationProvider(
    _deviceCodeCredential, {
      scopes: settings.graphUserScopes
    });



  _userClient = graph.Client.initWithMiddleware({
    authProvider: authProvider
    
  });
}
module.exports.initializeGraphForUserAuth = initializeGraphForUserAuth;

async function getUserTokenAsync() {
    // Ensure credential isn't undefined
    if (!_deviceCodeCredential) {
      throw new Error('Graph has not been initialized for user auth');
    }
  
    // Ensure scopes isn't undefined
    if (!_settings?.graphUserScopes) {
      throw new Error('Setting "scopes" cannot be undefined');
    }
  
    // Request token with given scopes
    const response = await _deviceCodeCredential.getToken(_settings?.graphUserScopes);
    return response.token;
  }
  module.exports.getUserTokenAsync = getUserTokenAsync;

  async function getUserAsync() {
    // Ensure client isn't undefined
    if (!_userClient) {
      throw new Error('Graph has not been initialized for user auth');
    }
  
    return _userClient.api('/me')
      // Only request specific properties
      .select(['displayName', 'mail', 'userPrincipalName'])
      .get();
  }
  module.exports.getUserAsync = getUserAsync;

  async function getInboxAsync() {
    // Ensure client isn't undefined
    if (!_userClient) {
      throw new Error('Graph has not been initialized for user auth');
    }
  
    return _userClient.api('/me/mailFolders/inbox/messages')
      .select(['from', 'isRead', 'receivedDateTime', 'subject'])
      .top(25)
      .orderby('receivedDateTime DESC')
      .get();
  }
  module.exports.getInboxAsync = getInboxAsync;

  async function sendMailAsync(subject, body, recipient) {
    // Ensure client isn't undefined
    if (!_userClient) {
      throw new Error('Graph has not been initialized for user auth');
    }
  
    // Create a new message
    const message = {
      subject: subject,
      body: {
        content: body,
        contentType: 'text'
      },
      toRecipients: [
        {
          emailAddress: {
            address: recipient
          }
        }
      ]
    };
  
    // Send the message
    return _userClient.api('me/sendMail')
      .post({
        message: message
      });
  }
  module.exports.sendMailAsync = sendMailAsync;

//Zusätzliche Funktion Kalendar abrufen

async function listCalendars() {
    return _userClient.api('/me/calendars').get();
  }
  module.exports.listCalendars = listCalendars;
 
//Zusätzliche Funktion Kalendar Eintrag schicken

async function sendCalendarEntry() {
    
    const event = {
      subject: 'Go for a beer',
      body: {
        contentType: 'HTML',
        content: 'Do you have time?'
      },
      start: {
          dateTime: '2024-05-10T12:00:00',
          timeZone: 'Europe/Vienna'
      },
      end: {
          dateTime: '2024-05-10T14:00:00',
          timeZone: 'Europe/Vienna'
      },
      location: {
          displayName: 'Pub Grz'
      },
      attendees: [
        {
          emailAddress: {
            address: 'hannes.kraxner@edu.fh-joanneum.at',
            name: 'Hannes Kraxner'
          },
          type: 'required'
        }
      ],
      allowNewTimeProposals: true,
      transactionId: '12345'
    };
    
    await _userClient.api('/me/events')
        .post(event);
  }
  module.exports.sendCalendarEntry = sendCalendarEntry;

