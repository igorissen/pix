import { Candidate } from '../../../../../../src/certification/enrolment/domain/models/Candidate.js';

const buildCandidate = function ({
  id = 123,
  createdAt = new Date(),
  firstName = 'Pat',
  lastName = 'Atrak',
  sex = 'F',
  birthCity = 'Nice',
  birthCountry = 'France',
  birthPostalCode = '06000',
  birthINSEECode = '06088',
  birthProvinceCode = '93',
  email = 'pat.atrak@example.com',
  resultRecipientEmail = 'otto.mate@example.com',
  birthdate = '1990-05-06',
  extraTimePercentage = 0.3,
  externalId = 'externalId',
  userId = 789,
  sessionId = 456,
  organizationLearnerId = null,
  authorizedToStart = false,
  billingMode = null,
  prepaymentCode = null,
  hasSeenCertificationInstructions = false,
  subscriptions = [],
} = {}) {
  return new Candidate({
    id,
    createdAt,
    firstName,
    lastName,
    sex,
    birthPostalCode,
    birthINSEECode,
    birthCity,
    birthProvinceCode,
    birthCountry,
    email,
    resultRecipientEmail,
    birthdate,
    extraTimePercentage,
    externalId,
    userId,
    sessionId,
    organizationLearnerId,
    authorizedToStart,
    billingMode,
    prepaymentCode,
    hasSeenCertificationInstructions,
    subscriptions,
  });
};

export { buildCandidate };