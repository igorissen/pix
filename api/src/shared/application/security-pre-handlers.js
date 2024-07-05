import bluebird from 'bluebird';
import jsonapiSerializer from 'jsonapi-serializer';
import lodash from 'lodash';

import * as checkUserIsAdminOfCertificationCenterWithCertificationCenterInvitationIdUseCase from '../../../lib/application/usecases/check-user-is-admin-of-certification-center-with-certification-center-invitation-id.js';
import * as checkUserIsAdminOfCertificationCenterWithCertificationCenterMembershipIdUseCase from '../../../lib/application/usecases/check-user-is-admin-of-certification-center-with-certification-center-membership-id.js';
import * as checkAdminMemberHasRoleCertifUseCase from '../../../lib/application/usecases/checkAdminMemberHasRoleCertif.js';
import * as checkAdminMemberHasRoleMetierUseCase from '../../../lib/application/usecases/checkAdminMemberHasRoleMetier.js';
import * as checkAdminMemberHasRoleSuperAdminUseCase from '../../../lib/application/usecases/checkAdminMemberHasRoleSuperAdmin.js';
import * as checkAdminMemberHasRoleSupportUseCase from '../../../lib/application/usecases/checkAdminMemberHasRoleSupport.js';
import * as checkAuthorizationToAccessCampaignUsecase from '../../../lib/application/usecases/checkAuthorizationToAccessCampaign.js';
import * as checkAuthorizationToManageCampaignUsecase from '../../../lib/application/usecases/checkAuthorizationToManageCampaign.js';
import * as checkIfUserIsBlockedUseCase from '../../../lib/application/usecases/checkIfUserIsBlocked.js';
import * as checkOrganizationIsScoAndManagingStudentUsecase from '../../../lib/application/usecases/checkOrganizationIsScoAndManagingStudent.js';
import * as checkPix1dEnabled from '../../../lib/application/usecases/checkPix1dEnabled.js';
import * as checkUserBelongsToLearnersOrganizationUseCase from '../../../lib/application/usecases/checkUserBelongsToLearnersOrganization.js';
import * as checkUserBelongsToOrganizationUseCase from '../../../lib/application/usecases/checkUserBelongsToOrganization.js';
import * as checkUserBelongsToOrganizationManagingStudentsUseCase from '../../../lib/application/usecases/checkUserBelongsToOrganizationManagingStudents.js';
import * as checkUserBelongsToScoOrganizationAndManagesStudentsUseCase from '../../../lib/application/usecases/checkUserBelongsToScoOrganizationAndManagesStudents.js';
import * as checkUserBelongsToSupOrganizationAndManagesStudentsUseCase from '../../../lib/application/usecases/checkUserBelongsToSupOrganizationAndManagesStudents.js';
import * as checkUserCanDisableHisOrganizationMembershipUseCase from '../../../lib/application/usecases/checkUserCanDisableHisOrganizationMembership.js';
import * as checkUserIsAdminAndManagingStudentsForOrganization from '../../../lib/application/usecases/checkUserIsAdminAndManagingStudentsForOrganization.js';
import * as checkUserIsAdminInOrganizationUseCase from '../../../lib/application/usecases/checkUserIsAdminInOrganization.js';
import * as checkUserIsAdminOfCertificationCenterUsecase from '../../../lib/application/usecases/checkUserIsAdminOfCertificationCenter.js';
import * as checkUserIsMemberOfCertificationCenterUsecase from '../../../lib/application/usecases/checkUserIsMemberOfCertificationCenter.js';
import * as checkUserIsMemberOfCertificationCenterSessionUsecase from '../../../lib/application/usecases/checkUserIsMemberOfCertificationCenterSession.js';
import * as checkUserOwnsCertificationCourseUseCase from '../../../lib/application/usecases/checkUserOwnsCertificationCourse.js';
import { Organization } from '../../../lib/domain/models/index.js';
import { PIX_ADMIN } from '../../authorization/domain/constants.js';
import * as checkUserIsCandidateUseCase from '../../certification/enrolment/application/usecases/checkUserIsCandidate.js';
import * as certificationIssueReportRepository from '../../certification/shared/infrastructure/repositories/certification-issue-report-repository.js';
import * as isSchoolSessionActive from '../../school/application/usecases/is-school-session-active.js';
import { ForbiddenAccess, NotFoundError } from '../domain/errors.js';
import * as organizationRepository from '../infrastructure/repositories/organization-repository.js';
import * as checkOrganizationHasFeatureUseCase from './usecases/checkOrganizationHasFeature.js';
import * as checkUserIsMemberOfAnOrganizationUseCase from './validator/checkUserIsMemberOfAnOrganization.js';

const { Error: JSONAPIError } = jsonapiSerializer;
const { has } = lodash;

function _replyForbiddenError(h) {
  const errorHttpStatusCode = 403;

  const jsonApiError = new JSONAPIError({
    code: errorHttpStatusCode,
    title: 'Forbidden access',
    detail: 'Missing or insufficient permissions.',
  });

  return h.response(jsonApiError).code(errorHttpStatusCode).takeover();
}

function _replyNotFoundError(h) {
  const errorHttpStatusCode = 404;

  const jsonApiError = new JSONAPIError({
    code: errorHttpStatusCode,
    title: 'Not found',
  });

  return h.response(jsonApiError).code(errorHttpStatusCode).takeover();
}

async function checkIfUserIsBlocked(
  request,
  h,
  dependencies = {
    checkIfUserIsBlockedUseCase,
  },
) {
  const { username, grant_type: grantType } = request.payload;

  if (grantType === 'password') {
    await dependencies.checkIfUserIsBlockedUseCase.execute(username);
  }

  return h.response(true);
}

async function checkUserIsCandidate(
  request,
  h,
  dependencies = {
    checkUserIsCandidateUseCase,
  },
) {
  const userId = request.auth.credentials.userId;
  const certificationCandidateId = request.params.certificationCandidateId;

  const isUserCandidate = await dependencies.checkUserIsCandidateUseCase.execute({ userId, certificationCandidateId });

  if (!isUserCandidate) {
    return _replyForbiddenError(h);
  }

  return h.response(true);
}

async function checkAdminMemberHasRoleSuperAdmin(
  request,
  h,
  dependencies = {
    checkAdminMemberHasRoleSuperAdminUseCase,
  },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;

  try {
    const hasRoleSuperAdmin = await dependencies.checkAdminMemberHasRoleSuperAdminUseCase.execute(userId);
    if (!hasRoleSuperAdmin) {
      throw new ForbiddenAccess(PIX_ADMIN.NOT_ALLOWED_MSG);
    }
    return h.response(true);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

async function checkAdminMemberHasRoleCertif(request, h, dependencies = { checkAdminMemberHasRoleCertifUseCase }) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;

  try {
    const hasRoleCertif = await dependencies.checkAdminMemberHasRoleCertifUseCase.execute(userId);
    if (!hasRoleCertif) {
      throw new ForbiddenAccess(PIX_ADMIN.NOT_ALLOWED_MSG);
    }
    return h.response(true);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

async function checkAdminMemberHasRoleSupport(request, h, dependencies = { checkAdminMemberHasRoleSupportUseCase }) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;

  try {
    const hasRoleSupport = await dependencies.checkAdminMemberHasRoleSupportUseCase.execute(userId);
    if (!hasRoleSupport) {
      throw new ForbiddenAccess(PIX_ADMIN.NOT_ALLOWED_MSG);
    }
    return h.response(true);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

async function checkAdminMemberHasRoleMetier(request, h, dependencies = { checkAdminMemberHasRoleMetierUseCase }) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;

  try {
    const hasRoleMetier = await dependencies.checkAdminMemberHasRoleMetierUseCase.execute(userId);
    if (!hasRoleMetier) {
      throw new ForbiddenAccess(PIX_ADMIN.NOT_ALLOWED_MSG);
    }
    return h.response(true);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

function checkRequestedUserIsAuthenticatedUser(request, h) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const authenticatedUserId = request.auth.credentials.userId;

  // We cannot guarantee that callers will enforce the type to be an integer upstream

  const requestedUserId = request.params.userId || parseInt(request.params.id);

  return authenticatedUserId === requestedUserId ? h.response(true) : _replyForbiddenError(h);
}

async function checkSchoolSessionIsActive(request, h, dependencies = { isSchoolSessionActive }) {
  if (await dependencies.isSchoolSessionActive.execute({ schoolCode: request.query.code })) {
    return h.response(true);
  }
  return _replyNotFoundError(h);
}

function checkUserIsAdminInOrganization(request, h, dependencies = { checkUserIsAdminInOrganizationUseCase }) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;

  //organizationId can be retrieved from path param in case organizations/id/invitations api or from memberships payload in case memberships/id
  let organizationId;

  if (request.path?.includes('memberships/me')) {
    organizationId = request.payload.organizationId;
  } else if (request.path?.includes('memberships')) {
    organizationId = request.payload.data.relationships.organization.data.id;
  } else {
    organizationId = request.params.organizationId || request.params.id;
  }

  return dependencies.checkUserIsAdminInOrganizationUseCase
    .execute(userId, organizationId)
    .then((isAdminInOrganization) => {
      if (isAdminInOrganization) {
        return h.response(true);
      }
      return _replyForbiddenError(h);
    })
    .catch(() => _replyForbiddenError(h));
}

function checkUserIsAdminOfCertificationCenter(
  request,
  h,
  dependencies = { checkUserIsAdminOfCertificationCenterUsecase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationCenterId = request.params.certificationCenterId;

  return dependencies.checkUserIsAdminOfCertificationCenterUsecase
    .execute(userId, certificationCenterId)
    .then((isAdminInCertificationCenter) => {
      if (isAdminInCertificationCenter) {
        return h.response(true);
      }
      return _replyForbiddenError(h);
    })
    .catch(() => _replyForbiddenError(h));
}

function checkUserIsAdminOfCertificationCenterWithCertificationCenterInvitationId(
  request,
  h,
  dependencies = { checkUserIsAdminOfCertificationCenterWithCertificationCenterInvitationIdUseCase },
) {
  if (
    !request.auth.credentials ||
    !request.auth.credentials.userId ||
    !request.params.certificationCenterInvitationId
  ) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationCenterInvitationId = request.params.certificationCenterInvitationId;

  return dependencies.checkUserIsAdminOfCertificationCenterWithCertificationCenterInvitationIdUseCase
    .execute({ certificationCenterInvitationId, userId })
    .then((isAdminInCertificationCenter) => {
      return isAdminInCertificationCenter ? h.response(true) : _replyForbiddenError(h);
    })
    .catch(() => _replyForbiddenError(h));
}

function checkUserIsAdminOfCertificationCenterWithCertificationCenterMembershipId(
  request,
  h,
  dependencies = { checkUserIsAdminOfCertificationCenterWithCertificationCenterMembershipIdUseCase },
) {
  if (
    !request.auth.credentials ||
    !request.auth.credentials.userId ||
    !request.params.certificationCenterMembershipId
  ) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationCenterMembershipId = request.params.certificationCenterMembershipId;

  return dependencies.checkUserIsAdminOfCertificationCenterWithCertificationCenterMembershipIdUseCase
    .execute({ certificationCenterMembershipId, userId })
    .then((isAdminInCertificationCenter) => {
      return isAdminInCertificationCenter ? h.response(true) : _replyForbiddenError(h);
    })
    .catch(() => _replyForbiddenError(h));
}

function checkUserIsMemberOfCertificationCenter(
  request,
  h,
  dependencies = { checkUserIsMemberOfCertificationCenterUsecase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationCenterId = request.params.certificationCenterId;

  return dependencies.checkUserIsMemberOfCertificationCenterUsecase
    .execute(userId, certificationCenterId)
    .then((isMemberInCertificationCenter) => {
      if (isMemberInCertificationCenter) {
        return h.response(true);
      }
      return _replyForbiddenError(h);
    })
    .catch(() => _replyForbiddenError(h));
}

async function checkUserIsMemberOfCertificationCenterSessionFromCertificationIssueReportId(
  request,
  h,
  dependencies = { checkUserIsMemberOfCertificationCenterSessionUsecase, certificationIssueReportRepository },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationIssueReportId = request.params.id;

  try {
    const certificationIssueReport = await dependencies.certificationIssueReportRepository.get({
      id: certificationIssueReportId,
    });
    const isMemberOfSession = await dependencies.checkUserIsMemberOfCertificationCenterSessionUsecase.execute({
      userId,
      certificationCourseId: certificationIssueReport.certificationCourseId,
    });
    return isMemberOfSession ? h.response(true) : _replyForbiddenError(h);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

async function checkUserIsMemberOfCertificationCenterSessionFromCertificationCourseId(
  request,
  h,
  dependencies = {
    checkUserIsMemberOfCertificationCenterSessionUsecase,
  },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationCourseId = request.params.id;

  try {
    const isMemberOfSession = await dependencies.checkUserIsMemberOfCertificationCenterSessionUsecase.execute({
      userId,
      certificationCourseId,
    });
    return isMemberOfSession ? h.response(true) : _replyForbiddenError(h);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

async function checkUserBelongsToOrganizationManagingStudents(
  request,
  h,
  dependencies = { checkUserBelongsToOrganizationManagingStudentsUseCase },
) {
  if (!has(request, 'auth.credentials.userId')) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const organizationId = request.params.id;

  try {
    if (await dependencies.checkUserBelongsToOrganizationManagingStudentsUseCase.execute(userId, organizationId)) {
      return h.response(true);
    }
  } catch (err) {
    return _replyForbiddenError(h);
  }
  return _replyForbiddenError(h);
}

async function checkUserBelongsToScoOrganizationAndManagesStudents(
  request,
  h,
  dependencies = { checkUserBelongsToScoOrganizationAndManagesStudentsUseCase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const organizationId = request.params.id || request.payload.data.attributes['organization-id'];

  let belongsToScoOrganizationAndManageStudents;
  try {
    belongsToScoOrganizationAndManageStudents =
      await dependencies.checkUserBelongsToScoOrganizationAndManagesStudentsUseCase.execute(userId, organizationId);
  } catch (err) {
    return _replyForbiddenError(h);
  }

  if (belongsToScoOrganizationAndManageStudents) {
    return h.response(true);
  }

  return _replyForbiddenError(h);
}

async function checkCertificationCenterIsNotScoManagingStudents(
  request,
  h,
  dependencies = {
    checkOrganizationIsScoAndManagingStudentUsecase,
    checkUserIsMemberOfCertificationCenterUsecase,
    organizationRepository,
  },
) {
  if (_noCredentials(request)) {
    return _replyForbiddenError(h);
  }

  const certificationCenterId =
    request?.params?.certificationCenterId || request?.payload?.data?.attributes?.certificationCenterId;

  let organizationId;

  try {
    organizationId = await dependencies.organizationRepository.getIdByCertificationCenterId(certificationCenterId);
  } catch (error) {
    if (_noOrganizationFound(error)) {
      return h.response(true);
    }
  }

  const isOrganizationScoManagingStudent = await dependencies.checkOrganizationIsScoAndManagingStudentUsecase.execute({
    organizationId,
  });

  if (isOrganizationScoManagingStudent) {
    return _replyForbiddenError(h);
  }

  return h.response(true);
}

async function checkUserDoesNotBelongsToScoOrganizationManagingStudents(
  request,
  h,
  dependencies = {
    checkOrganizationIsScoAndManagingStudentUsecase,
    organizationRepository,
  },
) {
  if (_noCredentials(request)) {
    return _replyForbiddenError(h);
  }

  const organizationId = request.params.id;

  const isOrganizationScoManagingStudent = await dependencies.checkOrganizationIsScoAndManagingStudentUsecase.execute({
    organizationId,
  });

  if (isOrganizationScoManagingStudent) {
    return _replyForbiddenError(h);
  }

  return h.response(true);
}

function _noCredentials(request) {
  return !request?.auth?.credentials || !request.auth.credentials.userId;
}

async function checkUserBelongsToSupOrganizationAndManagesStudents(
  request,
  h,
  dependencies = { checkUserBelongsToSupOrganizationAndManagesStudentsUseCase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const organizationId = request.params.id || request.payload.data.attributes['organization-id'];

  let belongsToSupOrganizationAndManageStudents;
  try {
    belongsToSupOrganizationAndManageStudents =
      await dependencies.checkUserBelongsToSupOrganizationAndManagesStudentsUseCase.execute(userId, organizationId);
  } catch (err) {
    return _replyForbiddenError(h);
  }

  if (belongsToSupOrganizationAndManageStudents) {
    return h.response(true);
  }

  return _replyForbiddenError(h);
}

async function checkUserIsAdminInSCOOrganizationManagingStudents(
  request,
  h,
  dependencies = { checkUserIsAdminAndManagingStudentsForOrganization },
) {
  const userId = request.auth.credentials.userId;
  const organizationId = request.params.organizationId || request.params.id;

  if (
    await dependencies.checkUserIsAdminAndManagingStudentsForOrganization.execute(
      userId,
      organizationId,
      Organization.types.SCO,
    )
  ) {
    return h.response(true);
  }
  return _replyForbiddenError(h);
}

async function checkUserIsAdminInSUPOrganizationManagingStudents(
  request,
  h,
  dependencies = { checkUserIsAdminAndManagingStudentsForOrganization },
) {
  const userId = request.auth.credentials.userId;
  const organizationId = request.params.organizationId || request.params.id;

  if (
    await dependencies.checkUserIsAdminAndManagingStudentsForOrganization.execute(
      userId,
      organizationId,
      Organization.types.SUP,
    )
  ) {
    return h.response(true);
  }

  return _replyForbiddenError(h);
}

async function checkUserBelongsToLearnersOrganization(
  request,
  h,
  dependencies = { checkUserBelongsToLearnersOrganizationUseCase },
) {
  if (!request.auth.credentials) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const organizationLearnerId = request.params.id;

  let belongsToLearnersOrganization;

  try {
    belongsToLearnersOrganization = await dependencies.checkUserBelongsToLearnersOrganizationUseCase.execute(
      userId,
      organizationLearnerId,
    );
  } catch (e) {
    return _replyForbiddenError(h);
  }
  if (belongsToLearnersOrganization) {
    return h.response(true);
  }
  return _replyForbiddenError(h);
}

async function checkUserBelongsToOrganization(request, h, dependencies = { checkUserBelongsToOrganizationUseCase }) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const organizationId = request.params.organizationId || request.params.id;

  const belongsToOrganization = await dependencies.checkUserBelongsToOrganizationUseCase.execute(
    userId,
    organizationId,
  );
  if (belongsToOrganization) {
    return h.response(true);
  }
  return _replyForbiddenError(h);
}

async function checkUserIsMemberOfAnOrganization(
  request,
  h,
  dependencies = { checkUserIsMemberOfAnOrganizationUseCase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;

  let isMemberOfAnOrganization;
  try {
    isMemberOfAnOrganization = await dependencies.checkUserIsMemberOfAnOrganizationUseCase.execute(userId);
  } catch (err) {
    return _replyForbiddenError(h);
  }

  if (isMemberOfAnOrganization) {
    return h.response(true);
  }
  return _replyForbiddenError(h);
}

async function checkAuthorizationToManageCampaign(
  request,
  h,
  dependencies = { checkAuthorizationToManageCampaignUsecase },
) {
  const userId = request.auth.credentials.userId;
  const campaignId = request.params.id;
  const isAdminOrOwnerOfTheCampaign = await dependencies.checkAuthorizationToManageCampaignUsecase.execute({
    userId,
    campaignId,
  });

  if (isAdminOrOwnerOfTheCampaign) return h.response(true);
  return _replyForbiddenError(h);
}

async function checkAuthorizationToAccessCampaign(
  request,
  h,
  dependencies = { checkAuthorizationToAccessCampaignUsecase },
) {
  const userId = request.auth.credentials.userId;
  const campaignId = request.params.campaignId || request.params.id;
  const belongsToOrganization = await dependencies.checkAuthorizationToAccessCampaignUsecase.execute({
    userId,
    campaignId,
  });

  if (belongsToOrganization) return h.response(true);
  return _replyForbiddenError(h);
}

function hasAtLeastOneAccessOf(securityChecks) {
  return async (request, h) => {
    const responses = await bluebird.map(securityChecks, (securityCheck) => securityCheck(request, h));
    const hasAccess = responses.some((response) => !response.source?.errors);
    return hasAccess ? hasAccess : _replyForbiddenError(h);
  };
}

function validateAllAccess(securityChecks) {
  return async (request, h) => {
    const responses = await bluebird.map(securityChecks, (securityCheck) => securityCheck(request, h));
    const hasAccess = responses.every((response) => !response.source?.errors);
    return hasAccess ? hasAccess : _replyForbiddenError(h);
  };
}

async function checkPix1dActivated(request, h, dependencies = { checkPix1dEnabled }) {
  const isPix1dEnabled = await dependencies.checkPix1dEnabled.execute();

  if (isPix1dEnabled) return h.response(true);
  return _replyForbiddenError(h);
}

async function checkUserOwnsCertificationCourse(
  request,
  h,
  dependencies = { checkUserOwnsCertificationCourseUseCase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const certificationCourseId = request.params.id;

  try {
    const ownsCertificationCourse = await dependencies.checkUserOwnsCertificationCourseUseCase.execute({
      userId,
      certificationCourseId,
    });
    return ownsCertificationCourse ? h.response(true) : _replyForbiddenError(h);
  } catch (e) {
    return _replyForbiddenError(h);
  }
}

async function checkUserCanDisableHisOrganizationMembership(
  request,
  h,
  dependencies = { checkUserCanDisableHisOrganizationMembershipUseCase },
) {
  if (!request.auth.credentials || !request.auth.credentials.userId) {
    return _replyForbiddenError(h);
  }

  const userId = request.auth.credentials.userId;
  const organizationId = request.payload.organizationId;

  try {
    const canDisableHisOrganizationMembership =
      await dependencies.checkUserCanDisableHisOrganizationMembershipUseCase.execute({
        organizationId,
        userId,
      });

    if (canDisableHisOrganizationMembership) {
      return h.response(true);
    }

    return _replyForbiddenError(h);
  } catch (_) {
    return _replyForbiddenError(h);
  }
}

function makeCheckOrganizationHasFeature(featureKey) {
  return async function (request, h, dependencies = { checkOrganizationHasFeatureUseCase }) {
    try {
      const organizationId = request.params.organizationId || request.params.id;
      await dependencies.checkOrganizationHasFeatureUseCase.execute({
        organizationId,
        featureKey,
      });
      return h.response(true);
    } catch (e) {
      return _replyForbiddenError(h);
    }
  };
}

function _noOrganizationFound(error) {
  return error instanceof NotFoundError;
}

const securityPreHandlers = {
  hasAtLeastOneAccessOf,
  validateAllAccess,
  checkAdminMemberHasRoleCertif,
  checkAdminMemberHasRoleMetier,
  checkAdminMemberHasRoleSuperAdmin,
  checkAdminMemberHasRoleSupport,
  checkAuthorizationToManageCampaign,
  checkAuthorizationToAccessCampaign,
  checkCertificationCenterIsNotScoManagingStudents,
  checkIfUserIsBlocked,
  checkPix1dActivated,
  checkRequestedUserIsAuthenticatedUser,
  checkSchoolSessionIsActive,
  checkUserBelongsToLearnersOrganization,
  checkUserBelongsToOrganization,
  checkUserBelongsToOrganizationManagingStudents,
  checkUserBelongsToScoOrganizationAndManagesStudents,
  checkUserBelongsToSupOrganizationAndManagesStudents,
  checkUserCanDisableHisOrganizationMembership,
  checkUserDoesNotBelongsToScoOrganizationManagingStudents,
  checkUserIsAdminInOrganization,
  checkUserIsAdminInSCOOrganizationManagingStudents,
  checkUserIsAdminInSUPOrganizationManagingStudents,
  checkUserIsMemberOfAnOrganization,
  checkUserIsAdminOfCertificationCenter,
  checkUserIsAdminOfCertificationCenterWithCertificationCenterInvitationId,
  checkUserIsAdminOfCertificationCenterWithCertificationCenterMembershipId,
  checkUserIsCandidate,
  checkUserIsMemberOfCertificationCenter,
  checkUserIsMemberOfCertificationCenterSessionFromCertificationCourseId,
  checkUserIsMemberOfCertificationCenterSessionFromCertificationIssueReportId,
  checkUserOwnsCertificationCourse,
  makeCheckOrganizationHasFeature,
};

export { securityPreHandlers };
