const DEFAULT_PASSWORD = 'pix123';

const TEAM_DEVCOMP_OFFSET_ID = 8000;

let nextId = TEAM_DEVCOMP_OFFSET_ID;

//USERS
const SCO_ORGANIZATION_USER_ID = nextId++;

//ORGANIZATIONS
const SCO_ORGANIZATION_ID = nextId++;

export { DEFAULT_PASSWORD, SCO_ORGANIZATION_ID, SCO_ORGANIZATION_USER_ID };