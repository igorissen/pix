const User = require('../../../../lib/domain/models/User');

const buildMembership = require('./build-membership');
const buildPixAdminRole = require('./build-pix-admin-role');
const buildCertificationCenterMembership = require('./build-certification-center-membership');
const buildAuthenticationMethod = require('./build-authentication-method');

module.exports = function buildUser({
  id = 123,
  firstName = 'Lorie',
  lastName = 'MeilleureAmie',
  email = 'jeseraila@example.net',
  username,
  cgu = true,
  lang = 'fr',
  lastTermsOfServiceValidatedAt = null,
  lastPixOrgaTermsOfServiceValidatedAt = null,
  lastPixCertifTermsOfServiceValidatedAt = null,
  mustValidateTermsOfService = false,
  pixOrgaTermsOfServiceAccepted = false,
  pixCertifTermsOfServiceAccepted = false,
  hasSeenAssessmentInstructions = false,
  isAnonymous = false,
  pixAdminRoles = [buildPixAdminRole({ userId: 123 })],
  memberships = [buildMembership()],
  certificationCenterMemberships = [buildCertificationCenterMembership()],
  authenticationMethods = [buildAuthenticationMethod.withPixAsIdentityProviderAndHashedPassword()],
} = {}) {
  return new User({
    id,
    firstName,
    lastName,
    email,
    username,
    cgu,
    lang,
    lastTermsOfServiceValidatedAt,
    lastPixOrgaTermsOfServiceValidatedAt,
    lastPixCertifTermsOfServiceValidatedAt,
    mustValidateTermsOfService,
    pixOrgaTermsOfServiceAccepted,
    pixCertifTermsOfServiceAccepted,
    hasSeenAssessmentInstructions,
    isAnonymous,
    pixAdminRoles,
    memberships,
    certificationCenterMemberships,
    authenticationMethods,
  });
};
