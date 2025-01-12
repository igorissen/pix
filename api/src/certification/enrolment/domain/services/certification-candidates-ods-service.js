import bluebird from 'bluebird';
import _ from 'lodash';

import { config } from '../../../../shared/config.js';
import { CertificationCandidatesError } from '../../../../shared/domain/errors.js';
import * as mailCheckImplementation from '../../../../shared/mail/infrastructure/services/mail-check.js';
import { CERTIFICATION_CANDIDATES_ERRORS } from '../../../shared/domain/constants/certification-candidates-errors.js';
import { ComplementaryCertificationKeys } from '../../../shared/domain/models/ComplementaryCertificationKeys.js';
import { getTransformationStructsForPixCertifCandidatesImport } from '../../infrastructure/files/candidates-import/candidates-import-transformation-structures.js';
import * as readOdsUtils from '../../infrastructure/utils/ods/read-ods-utils.js';
import { Candidate } from '../models/Candidate.js';
import { Subscription } from '../models/Subscription.js';

export { extractCertificationCandidatesFromCandidatesImportSheet };

async function extractCertificationCandidatesFromCandidatesImportSheet({
  i18n,
  sessionId,
  isSco,
  odsBuffer,
  certificationCpfService,
  certificationCpfCountryRepository,
  certificationCpfCityRepository,
  complementaryCertificationRepository,
  certificationCenterRepository,
  mailCheck = mailCheckImplementation,
}) {
  const translate = i18n.__;
  const certificationCenter = await certificationCenterRepository.getBySessionId({ sessionId });
  const candidateImportStructs = getTransformationStructsForPixCertifCandidatesImport({
    i18n,
    complementaryCertifications: certificationCenter.habilitations,
    isSco,
  });
  try {
    await readOdsUtils.validateOdsHeaders({
      odsBuffer,
      headers: candidateImportStructs.headers,
    });
  } catch (err) {
    _handleVersionError();
  }
  const tableHeaderTargetPropertyMap = candidateImportStructs.transformStruct;
  let candidatesDataByLine = null;
  try {
    candidatesDataByLine = await readOdsUtils.extractTableDataFromOdsFile({
      odsBuffer,
      tableHeaderTargetPropertyMap,
    });
  } catch {
    _handleParsingError();
  }

  candidatesDataByLine = _filterOutEmptyCandidateData(candidatesDataByLine);

  const _checkForDuplication = _handleDuplicateCandidate();
  return await bluebird.mapSeries(Object.entries(candidatesDataByLine), async ([line, candidateData]) => {
    let { sex, birthCountry, birthINSEECode, birthPostalCode, birthCity, billingMode } = candidateData;
    const { email, resultRecipientEmail } = candidateData;
    const { hasCleaNumerique, hasPixPlusDroit, hasPixPlusEdu1erDegre, hasPixPlusEdu2ndDegre, hasPixPlusProSante } =
      candidateData;

    if (birthINSEECode && birthINSEECode !== '99' && birthINSEECode.length < 5)
      candidateData.birthINSEECode = `0${birthINSEECode}`;
    if (birthPostalCode && birthPostalCode.length < 5) candidateData.birthPostalCode = `0${birthPostalCode}`;

    if (candidateData.sex?.toUpperCase() === 'M') sex = 'M';
    if (candidateData.sex?.toUpperCase() === 'F') sex = 'F';

    const cpfBirthInformation = await certificationCpfService.getBirthInformation({
      ...candidateData,
      certificationCpfCityRepository,
      certificationCpfCountryRepository,
    });

    const complementaryCertificationsInDB = await complementaryCertificationRepository.findAll();
    const subscriptions = _buildSubscriptions({
      hasCleaNumerique,
      hasPixPlusDroit,
      hasPixPlusEdu1erDegre,
      hasPixPlusEdu2ndDegre,
      hasPixPlusProSante,
      complementaryCertificationsInDB,
    });

    if (!config.featureToggles.isCoreComplementaryCompatibilityEnabled) {
      if (_hasMoreThanOneComplementarySubscription(subscriptions)) {
        line = parseInt(line) + 1;

        throw new CertificationCandidatesError({
          code: CERTIFICATION_CANDIDATES_ERRORS.CANDIDATE_MAX_ONE_COMPLEMENTARY_CERTIFICATION.code,
          message: 'A candidate cannot have more than one complementary certification',
          meta: { line },
        });
      }
    } else {
      if (!_areSubscriptionsValid(subscriptions, complementaryCertificationsInDB)) {
        line = parseInt(line) + 1;

        throw new CertificationCandidatesError({
          code: CERTIFICATION_CANDIDATES_ERRORS.CANDIDATE_WRONG_SUBSCRIPTIONS_COMPATIBILITY.code,
          message: 'A candidate cannot have more than one subscription to a certification',
          meta: { line },
        });
      }
    }

    if (cpfBirthInformation.hasFailed()) {
      _handleBirthInformationValidationError(cpfBirthInformation, line);
    }

    birthCountry = cpfBirthInformation.birthCountry;
    birthINSEECode = cpfBirthInformation.birthINSEECode;
    birthPostalCode = cpfBirthInformation.birthPostalCode;
    birthCity = cpfBirthInformation.birthCity;

    if (billingMode) {
      billingMode = Candidate.parseBillingMode({ billingMode, translate });
    }

    if (resultRecipientEmail) {
      try {
        await mailCheck.checkDomainIsValid(resultRecipientEmail);
      } catch {
        throw new CertificationCandidatesError({
          code: CERTIFICATION_CANDIDATES_ERRORS.CANDIDATE_RESULT_RECIPIENT_EMAIL_NOT_VALID.code,
          meta: { line, value: resultRecipientEmail },
        });
      }
    }

    if (email) {
      try {
        await mailCheck.checkDomainIsValid(email);
      } catch {
        throw new CertificationCandidatesError({
          code: CERTIFICATION_CANDIDATES_ERRORS.CANDIDATE_EMAIL_NOT_VALID.code,
          meta: { line, value: email },
        });
      }
    }

    const candidate = new Candidate({
      ...candidateData,
      birthCountry,
      birthINSEECode,
      birthPostalCode,
      birthCity,
      sex,
      sessionId,
      billingMode: billingMode ?? null,
      prepaymentCode: candidateData.prepaymentCode ?? null,
      subscriptions,
      id: null,
      birthProvinceCode: null,
      createdAt: null,
      organizationLearnerId: null,
      userId: null,
    });

    try {
      candidate.validate(isSco);
      _checkForDuplication(candidate);
    } catch (err) {
      throw new CertificationCandidatesError({
        code: err.code,
        meta: { line: parseInt(line) + 1, value: err.meta },
      });
    }

    return candidate;
  });
}

function _hasMoreThanOneComplementarySubscription(subscriptions) {
  return subscriptions.filter((subscription) => subscription.isComplementary()).length > 1;
}

function _areSubscriptionsValid(subscriptions, complementaryCertificationsInDB) {
  if (subscriptions.length === 1) return true;
  if (subscriptions.length === 2) {
    const cleaComplementaryCertification = complementaryCertificationsInDB.find(
      (cc) => cc.key === ComplementaryCertificationKeys.CLEA,
    );
    const hasCore = subscriptions.some((subscription) => subscription.isCore);
    const hasClea = subscriptions.some(
      (subscription) => subscription.complementaryCertificationId === cleaComplementaryCertification.id,
    );
    return hasCore && hasClea;
  }
  return false;
}

function _filterOutEmptyCandidateData(certificationCandidatesData) {
  return _(certificationCandidatesData)
    .mapValues(_nullifyObjectWithOnlyNilValues)
    .pickBy((value) => !_.isNull(value))
    .value();
}

function _nullifyObjectWithOnlyNilValues(data) {
  for (const propName in data) {
    if (!_.isNil(data[propName])) {
      return data;
    }
  }
  return null;
}

function _handleBirthInformationValidationError(cpfBirthInformation, line) {
  line = parseInt(line) + 1;
  const { birthCountry, birthINSEECode, birthPostalCode, birthCity, firstErrorCode } = cpfBirthInformation;
  throw new CertificationCandidatesError({
    code: firstErrorCode,
    meta: { line, birthCountry, birthINSEECode, birthPostalCode, birthCity },
  });
}

function _handleVersionError() {
  throw new CertificationCandidatesError({
    code: 'INVALID_DOCUMENT',
    message: 'This version of the document is unknown.',
  });
}

function _handleParsingError() {
  throw new CertificationCandidatesError({ code: 'INVALID_DOCUMENT', message: 'Le document est invalide.' });
}

function _handleDuplicateCandidate() {
  const candidateFootprints = new Set();
  return ({ firstName, lastName, birthdate }) => {
    const candidateInformationFootprint = firstName.toLowerCase() + lastName.toLowerCase() + birthdate;
    if (candidateFootprints.has(candidateInformationFootprint)) {
      throw new CertificationCandidatesError({
        code: 'DUPLICATE_CANDIDATE',
      });
    } else {
      candidateFootprints.add(candidateInformationFootprint);
    }
  };
}

function _buildComplementaryCertification(complementaryCertificationId) {
  return Subscription.buildComplementary({
    certificationCandidateId: null,
    complementaryCertificationId,
  });
}

function _buildSubscriptions({
  hasCleaNumerique,
  hasPixPlusDroit,
  hasPixPlusEdu1erDegre,
  hasPixPlusEdu2ndDegre,
  hasPixPlusProSante,
  complementaryCertificationsInDB,
}) {
  const subscriptions = [];
  const complementaryCertificationsByKey = _.keyBy(complementaryCertificationsInDB, 'key');
  const isCompatibilityEnabled = config.featureToggles.isCoreComplementaryCompatibilityEnabled;
  if (!isCompatibilityEnabled) {
    subscriptions.push(Subscription.buildCore({ certificationCandidateId: null }));
  }
  if (hasCleaNumerique) {
    if (isCompatibilityEnabled) {
      subscriptions.push(Subscription.buildCore({ certificationCandidateId: null }));
    }
    subscriptions.push(
      _buildComplementaryCertification(complementaryCertificationsByKey[ComplementaryCertificationKeys.CLEA].id),
    );
  }
  if (hasPixPlusDroit) {
    subscriptions.push(
      _buildComplementaryCertification(
        complementaryCertificationsByKey[ComplementaryCertificationKeys.PIX_PLUS_DROIT].id,
      ),
    );
  }
  if (hasPixPlusEdu1erDegre) {
    subscriptions.push(
      _buildComplementaryCertification(
        complementaryCertificationsByKey[ComplementaryCertificationKeys.PIX_PLUS_EDU_1ER_DEGRE].id,
      ),
    );
  }
  if (hasPixPlusEdu2ndDegre) {
    subscriptions.push(
      _buildComplementaryCertification(
        complementaryCertificationsByKey[ComplementaryCertificationKeys.PIX_PLUS_EDU_2ND_DEGRE].id,
      ),
    );
  }
  if (hasPixPlusProSante) {
    subscriptions.push(
      _buildComplementaryCertification(
        complementaryCertificationsByKey[ComplementaryCertificationKeys.PIX_PLUS_PRO_SANTE].id,
      ),
    );
  }
  if (subscriptions.length === 0) {
    subscriptions.push(Subscription.buildCore({ certificationCandidateId: null }));
  }

  return subscriptions;
}
