const DEFAULT_PASSWORD = 'pix123';

const TEAM_PRESCRIPTION_OFFSET_ID = 6000;

//USERS
const SCO_ORGANIZATION_USER_ID = TEAM_PRESCRIPTION_OFFSET_ID;
const SUP_ORGANIZATION_USER_ID = TEAM_PRESCRIPTION_OFFSET_ID + 1;
const PRO_ORGANIZATION_USER_ID = TEAM_PRESCRIPTION_OFFSET_ID + 2;

const ALL_ORGANIZATION_USER_ID = TEAM_PRESCRIPTION_OFFSET_ID + 3;

//ORGANIZATIONS
const SCO_ORGANIZATION_ID = TEAM_PRESCRIPTION_OFFSET_ID;
const SUP_ORGANIZATION_ID = TEAM_PRESCRIPTION_OFFSET_ID + 1;
const PRO_ORGANIZATION_ID = TEAM_PRESCRIPTION_OFFSET_ID + 2;

//TARGET PROFILES
const TARGET_PROFILE_NO_BADGES_NO_STAGES_ID = TEAM_PRESCRIPTION_OFFSET_ID;
const TARGET_PROFILE_BADGES_STAGES_ID = TEAM_PRESCRIPTION_OFFSET_ID + 1;

//BADGES
const BADGES_TUBES_CAMP_ID = TEAM_PRESCRIPTION_OFFSET_ID;
const BADGES_CAMP_ID = TEAM_PRESCRIPTION_OFFSET_ID + 1;

export {
  ALL_ORGANIZATION_USER_ID,
  BADGES_CAMP_ID,
  BADGES_TUBES_CAMP_ID,
  DEFAULT_PASSWORD,
  PRO_ORGANIZATION_ID,
  PRO_ORGANIZATION_USER_ID,
  SCO_ORGANIZATION_ID,
  SCO_ORGANIZATION_USER_ID,
  SUP_ORGANIZATION_ID,
  SUP_ORGANIZATION_USER_ID,
  TARGET_PROFILE_BADGES_STAGES_ID,
  TARGET_PROFILE_NO_BADGES_NO_STAGES_ID,
};
