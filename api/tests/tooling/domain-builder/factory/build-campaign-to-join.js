import { types } from '../../../../src/organizational-entities/domain/models/Organization.js';
import { CampaignToJoin } from '../../../../src/prescription/campaign/domain/read-models/CampaignToJoin.js';
import { CampaignTypes } from '../../../../src/prescription/shared/domain/constants.js';

const buildCampaignToJoin = function ({
  id = 1,
  code = 'AZERTY123',
  title = 'Un titre de campagne',
  idPixLabel = 'Un id pix label',
  customLandingPageText = 'Une custom landing page',
  externalIdHelpImageUrl = 'baseCodeExternalIdImage',
  alternativeTextToExternalIdHelpImage = 'Une aide pour id externe',
  archivedAt = null,
  deletedAt = null,
  type = CampaignTypes.ASSESSMENT,
  isForAbsoluteNovice = false,
  organizationId = 2,
  organizationName = 'NomOrga',
  organizationType = types.PRO,
  organizationLogoUrl = 'baseCodeOrgaLogoImage',
  organizationIsManagingStudents = false,
  hasLearnersImportFeature = false,
  identityProvider = null,
  organizationShowNPS = true,
  organizationFormNPSUrl = 'https://pix.fr/nps-pix-emploi/',
  targetProfileName = 'Le profil cible',
  targetProfileImageUrl = 'targetProfileImageUrl',
  multipleSendings = false,
  assessmentMethod = 'SMART_RANDOM',
} = {}) {
  return new CampaignToJoin({
    id,
    code,
    title,
    idPixLabel,
    customLandingPageText,
    externalIdHelpImageUrl,
    alternativeTextToExternalIdHelpImage,
    archivedAt,
    deletedAt,
    type,
    isForAbsoluteNovice,
    organizationId,
    organizationName,
    organizationType,
    organizationLogoUrl,
    organizationIsManagingStudents,
    hasLearnersImportFeature,
    identityProvider,
    organizationShowNPS,
    organizationFormNPSUrl,
    targetProfileName,
    targetProfileImageUrl,
    multipleSendings,
    assessmentMethod,
  });
};

export { buildCampaignToJoin };
