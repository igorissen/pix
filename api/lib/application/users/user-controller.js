import { usecases as devcompUsecases } from '../../../src/devcomp/domain/usecases/index.js';
import * as trainingSerializer from '../../../src/devcomp/infrastructure/serializers/jsonapi/training-serializer.js';
import { evaluationUsecases } from '../../../src/evaluation/domain/usecases/index.js';
import * as scorecardSerializer from '../../../src/evaluation/infrastructure/serializers/jsonapi/scorecard-serializer.js';
import * as campaignParticipationSerializer from '../../../src/prescription/campaign-participation/infrastructure/serializers/jsonapi/campaign-participation-serializer.js';
import * as userSerializer from '../../../src/shared/infrastructure/serializers/jsonapi/user-serializer.js';
import * as requestResponseUtils from '../../../src/shared/infrastructure/utils/request-response-utils.js';
import { usecases } from '../../domain/usecases/index.js';
import { DomainTransaction } from '../../infrastructure/DomainTransaction.js';
import * as campaignParticipationOverviewSerializer from '../../infrastructure/serializers/jsonapi/campaign-participation-overview-serializer.js';
import * as certificationCenterMembershipSerializer from '../../infrastructure/serializers/jsonapi/certification-center-membership-serializer.js';
import * as certificationEligibilitySerializer from '../../infrastructure/serializers/jsonapi/certification-eligibility-serializer.js';
import * as participantResultSerializer from '../../infrastructure/serializers/jsonapi/participant-result-serializer.js';
import * as profileSerializer from '../../infrastructure/serializers/jsonapi/profile-serializer.js';
import * as sharedProfileForCampaignSerializer from '../../infrastructure/serializers/jsonapi/shared-profile-for-campaign-serializer.js';
import * as userAnonymizedDetailsForAdminSerializer from '../../infrastructure/serializers/jsonapi/user-anonymized-details-for-admin-serializer.js';
import * as userDetailsForAdminSerializer from '../../infrastructure/serializers/jsonapi/user-details-for-admin-serializer.js';
import * as userForAdminSerializer from '../../infrastructure/serializers/jsonapi/user-for-admin-serializer.js';
import * as userOrganizationForAdminSerializer from '../../infrastructure/serializers/jsonapi/user-organization-for-admin-serializer.js';

const getUserDetailsForAdmin = async function (request, h, dependencies = { userDetailsForAdminSerializer }) {
  const userId = request.params.id;
  const userDetailsForAdmin = await usecases.getUserDetailsForAdmin({ userId });
  return dependencies.userDetailsForAdminSerializer.serialize(userDetailsForAdmin);
};

const updateUserDetailsForAdministration = async function (
  request,
  h,
  dependencies = { userDetailsForAdminSerializer },
) {
  const userId = request.params.id;
  const userDetailsForAdministration = dependencies.userDetailsForAdminSerializer.deserialize(request.payload);

  const updatedUser = await usecases.updateUserDetailsForAdministration({
    userId,
    userDetailsForAdministration,
  });

  return dependencies.userDetailsForAdminSerializer.serializeForUpdate(updatedUser);
};

const rememberUserHasSeenAssessmentInstructions = async function (request, h, dependencies = { userSerializer }) {
  const authenticatedUserId = request.auth.credentials.userId;

  const updatedUser = await usecases.rememberUserHasSeenAssessmentInstructions({ userId: authenticatedUserId });
  return dependencies.userSerializer.serialize(updatedUser);
};

const rememberUserHasSeenNewDashboardInfo = async function (request, h, dependencies = { userSerializer }) {
  const authenticatedUserId = request.auth.credentials.userId;

  const updatedUser = await usecases.rememberUserHasSeenNewDashboardInfo({ userId: authenticatedUserId });
  return dependencies.userSerializer.serialize(updatedUser);
};

const rememberUserHasSeenLevelSevenInfo = async function (request, h, dependencies = { userSerializer }) {
  const authenticatedUserId = request.auth.credentials.userId;

  const updatedUser = await usecases.rememberUserHasSeenLevelSevenInfo({ userId: authenticatedUserId });
  return dependencies.userSerializer.serialize(updatedUser);
};

const rememberUserHasSeenChallengeTooltip = async function (request, h, dependencies = { userSerializer }) {
  const authenticatedUserId = request.auth.credentials.userId;
  const challengeType = request.params.challengeType;

  const updatedUser = await usecases.rememberUserHasSeenChallengeTooltip({
    userId: authenticatedUserId,
    challengeType,
  });
  return dependencies.userSerializer.serialize(updatedUser);
};

const findPaginatedFilteredUsers = async function (request, h, dependencies = { userForAdminSerializer }) {
  const { filter, page } = request.query;

  const { models: users, pagination } = await usecases.findPaginatedFilteredUsers({ filter, page });
  return dependencies.userForAdminSerializer.serialize(users, pagination);
};

const findPaginatedUserRecommendedTrainings = async function (
  request,
  h,
  dependencies = {
    trainingSerializer,
    requestResponseUtils,
    devcompUsecases,
  },
) {
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);
  const { page } = request.query;
  const { userRecommendedTrainings, meta } = await dependencies.devcompUsecases.findPaginatedUserRecommendedTrainings({
    userId: request.auth.credentials.userId,
    locale,
    page,
  });

  return dependencies.trainingSerializer.serialize(userRecommendedTrainings, meta);
};

const getCampaignParticipations = function (request, h, dependencies = { campaignParticipationSerializer }) {
  const authenticatedUserId = request.auth.credentials.userId;

  return usecases
    .findLatestOngoingUserCampaignParticipations({ userId: authenticatedUserId })
    .then(dependencies.campaignParticipationSerializer.serialize);
};

const getCampaignParticipationOverviews = async function (
  request,
  h,
  dependencies = {
    campaignParticipationOverviewSerializer,
  },
) {
  const authenticatedUserId = request.auth.credentials.userId;
  const query = request.query;

  const userCampaignParticipationOverviews = await usecases.findUserCampaignParticipationOverviews({
    userId: authenticatedUserId,
    states: query.filter.states,
    page: query.page,
  });

  return dependencies.campaignParticipationOverviewSerializer.serializeForPaginatedList(
    userCampaignParticipationOverviews,
  );
};

const isCertifiable = async function (request, h, dependencies = { certificationEligibilitySerializer }) {
  const authenticatedUserId = request.auth.credentials.userId;

  const certificationEligibility = await usecases.getUserCertificationEligibility({ userId: authenticatedUserId });
  return dependencies.certificationEligibilitySerializer.serialize(certificationEligibility);
};

const getProfile = function (request, h, dependencies = { profileSerializer, requestResponseUtils }) {
  const authenticatedUserId = request.auth.credentials.userId;
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);

  return usecases
    .getUserProfile({ userId: authenticatedUserId, locale })
    .then(dependencies.profileSerializer.serialize);
};

const getProfileForAdmin = function (request, h, dependencies = { profileSerializer, requestResponseUtils }) {
  const userId = request.params.id;
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);

  return usecases.getUserProfile({ userId, locale }).then(dependencies.profileSerializer.serialize);
};

const resetScorecard = function (request, h, dependencies = { scorecardSerializer, requestResponseUtils }) {
  const authenticatedUserId = request.auth.credentials.userId;
  const competenceId = request.params.competenceId;
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);

  return evaluationUsecases
    .resetScorecard({ userId: authenticatedUserId, competenceId, locale })
    .then(dependencies.scorecardSerializer.serialize);
};

const getUserCampaignParticipationToCampaign = function (
  request,
  h,
  dependencies = { campaignParticipationSerializer },
) {
  const authenticatedUserId = request.auth.credentials.userId;
  const campaignId = request.params.campaignId;

  return usecases
    .getUserCampaignParticipationToCampaign({ userId: authenticatedUserId, campaignId })
    .then((campaignParticipation) => dependencies.campaignParticipationSerializer.serialize(campaignParticipation));
};

const getUserProfileSharedForCampaign = async function (
  request,
  h,
  dependencies = {
    sharedProfileForCampaignSerializer,
    requestResponseUtils,
  },
) {
  const authenticatedUserId = request.auth.credentials.userId;
  const campaignId = request.params.campaignId;
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);

  const sharedProfileForCampaign = await usecases.getUserProfileSharedForCampaign({
    userId: authenticatedUserId,
    campaignId,
    locale,
  });

  return dependencies.sharedProfileForCampaignSerializer.serialize(sharedProfileForCampaign);
};

const getUserCampaignAssessmentResult = async function (
  request,
  h,
  dependencies = {
    participantResultSerializer,
    requestResponseUtils,
  },
) {
  const authenticatedUserId = request.auth.credentials.userId;
  const campaignId = request.params.campaignId;
  const locale = dependencies.requestResponseUtils.extractLocaleFromRequest(request);

  const campaignAssessmentResult = await usecases.getUserCampaignAssessmentResult({
    userId: authenticatedUserId,
    campaignId,
    locale,
  });

  return dependencies.participantResultSerializer.serialize(campaignAssessmentResult);
};

const anonymizeUser = async function (request, h, dependencies = { userAnonymizedDetailsForAdminSerializer }) {
  const userToAnonymizeId = request.params.id;
  const adminMemberId = request.auth.credentials.userId;

  await DomainTransaction.execute(async (domainTransaction) => {
    await usecases.anonymizeUser({
      userId: userToAnonymizeId,
      updatedByUserId: adminMemberId,
      domainTransaction,
    });
  });

  const anonymizedUser = await usecases.getUserDetailsForAdmin({ userId: userToAnonymizeId });

  return h.response(dependencies.userAnonymizedDetailsForAdminSerializer.serialize(anonymizedUser)).code(200);
};

const removeAuthenticationMethod = async function (request, h) {
  const userId = request.params.id;
  const authenticationMethodType = request.payload.data.attributes.type;
  await usecases.removeAuthenticationMethod({ userId, authenticationMethodType });
  return h.response().code(204);
};

const addPixAuthenticationMethodByEmail = async function (
  request,
  h,
  dependencies = { userDetailsForAdminSerializer },
) {
  const userId = request.params.id;
  const email = request.payload.data.attributes.email.trim().toLowerCase();

  const userUpdated = await usecases.addPixAuthenticationMethodByEmail({
    userId,
    email,
  });
  return h.response(dependencies.userDetailsForAdminSerializer.serialize(userUpdated)).created();
};

const reassignAuthenticationMethods = async function (request, h) {
  const authenticationMethodId = request.params.authenticationMethodId;
  const originUserId = request.params.userId;
  const targetUserId = request.payload.data.attributes['user-id'];

  await usecases.reassignAuthenticationMethodToAnotherUser({
    originUserId,
    targetUserId,
    authenticationMethodId,
  });
  return h.response().code(204);
};

const findUserOrganizationsForAdmin = async function (
  request,
  h,
  dependencies = { userOrganizationForAdminSerializer },
) {
  const userId = request.params.id;
  const organizations = await usecases.findUserOrganizationsForAdmin({
    userId,
  });
  return h.response(dependencies.userOrganizationForAdminSerializer.serialize(organizations));
};

const findCertificationCenterMembershipsByUser = async function (
  request,
  h,
  dependencies = { certificationCenterMembershipSerializer },
) {
  const userId = request.params.id;
  const certificationCenterMemberships = await usecases.findCertificationCenterMembershipsByUser({
    userId,
  });
  return h.response(
    dependencies.certificationCenterMembershipSerializer.serializeForAdmin(certificationCenterMemberships),
  );
};

const userController = {
  addPixAuthenticationMethodByEmail,
  anonymizeUser,
  findCertificationCenterMembershipsByUser,
  findPaginatedFilteredUsers,
  findPaginatedUserRecommendedTrainings,
  findUserOrganizationsForAdmin,
  getCampaignParticipationOverviews,
  getCampaignParticipations,
  getProfile,
  getProfileForAdmin,
  getUserCampaignAssessmentResult,
  getUserCampaignParticipationToCampaign,
  getUserDetailsForAdmin,
  getUserProfileSharedForCampaign,
  isCertifiable,
  reassignAuthenticationMethods,
  rememberUserHasSeenAssessmentInstructions,
  rememberUserHasSeenChallengeTooltip,
  rememberUserHasSeenLevelSevenInfo,
  rememberUserHasSeenNewDashboardInfo,
  removeAuthenticationMethod,
  resetScorecard,
  updateUserDetailsForAdministration,
};

export { userController };
