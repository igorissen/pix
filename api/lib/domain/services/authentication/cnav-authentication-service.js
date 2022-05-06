const settings = require('../../../config');
const { v4: uuidv4 } = require('uuid');
const httpAgent = require('../../../infrastructure/http/http-agent');
const querystring = require('querystring');
const { AuthenticationTokenRetrievalError } = require('../../errors');
const jsonwebtoken = require('jsonwebtoken');

async function exchangeCodeForIdToken({ code, redirectUri }) {
  const data = {
    client_secret: settings.cnav.clientSecret,
    grant_type: 'authorization_code',
    code,
    client_id: settings.cnav.clientId,
    redirect_uri: redirectUri,
  };

  const response = await httpAgent.post({
    url: settings.cnav.tokenUrl,
    payload: querystring.stringify(data),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
  });

  if (!response.isSuccessful) {
    const errorMessage = JSON.stringify(response.data);
    throw new AuthenticationTokenRetrievalError(errorMessage, response.code);
  }

  return response.data['id_token'];
}

function getAuthUrl({ redirectUri }) {
  const redirectTarget = new URL(settings.cnav.authUrl);
  const state = uuidv4();
  const nonce = uuidv4();
  const clientId = settings.cnav.clientId;
  const params = [
    { key: 'state', value: state },
    { key: 'nonce', value: nonce },
    { key: 'client_id', value: clientId },
    { key: 'redirect_uri', value: redirectUri },
    { key: 'response_type', value: 'code' },
    {
      key: 'scope',
      value: 'openid profile',
    },
  ];

  params.forEach(({ key, value }) => redirectTarget.searchParams.append(key, value));

  return { redirectTarget: redirectTarget.toString(), state, nonce };
}

async function getUserInfo(idToken) {
  const { given_name, family_name, nonce, sub } = await _extractClaimsFromIdToken(idToken);

  return {
    firstName: given_name,
    lastName: family_name,
    externalIdentityId: sub,
    nonce,
  };
}

async function _extractClaimsFromIdToken(idToken) {
  const { given_name, family_name, nonce, sub } = await jsonwebtoken.decode(idToken);
  return { given_name, family_name, nonce, sub };
}

module.exports = {
  exchangeCodeForIdToken,
  getAuthUrl,
  getUserInfo,
};
