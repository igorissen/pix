const faker = require('faker');
const databaseBuffer = require('../database-buffer');
const Membership = require('../../../../lib/domain/models/Membership');
const encrypt = require('../../../../lib/domain/services/encryption-service');
const buildPixRole = require('./build-pix-role');
const buildUserPixRole = require('./build-user-pix-role');
const buildOrganization = require('./build-organization');
const buildMembership = require('./build-membership');
const _ = require('lodash');

const buildUser = function buildUser({
  id,
  firstName = faker.name.firstName(),
  lastName = faker.name.lastName(),
  email ,
  password,
  cgu = true,
  samlId,
} = {}) {

  password = _.isUndefined(password) ? encrypt.hashPasswordSync(faker.internet.password()) : encrypt.hashPasswordSync(password);
  email = _.isUndefined(email) ? faker.internet.exampleEmail().toLowerCase() : email.toLowerCase();
  
  const values = {
    id, firstName, lastName, email, password, cgu, samlId,
  };

  return databaseBuffer.pushInsertable({
    tableName: 'users',
    values,
  });
};

buildUser.withUnencryptedPassword = function buildUserWithUnencryptedPassword({
  id,
  firstName = faker.name.firstName(),
  lastName = faker.name.lastName(),
  email = faker.internet.email(),
  rawPassword = faker.internet.password(),
  cgu = true,
  samlId,
}) {

  const password = encrypt.hashPasswordSync(rawPassword);

  const values = {
    id, firstName, lastName, email, password, cgu, samlId,
  };

  return databaseBuffer.pushInsertable({
    tableName: 'users',
    values,
  });
};

buildUser.withPixRolePixMaster = function buildUserWithPixRolePixMaster({
  id,
  firstName = faker.name.firstName(),
  lastName = faker.name.lastName(),
  email = faker.internet.email(),
  password = encrypt.hashPasswordSync(faker.internet.password()),
  cgu = true,
} = {}) {

  const values = {
    id, firstName, lastName, email, password, cgu,
  };

  const pixRolePixMaster = buildPixRole({ name: 'PIX_MASTER' });

  const user = databaseBuffer.pushInsertable({
    tableName: 'users',
    values,
  });

  buildUserPixRole({ userId: user.id, pixRoleId: pixRolePixMaster.id });

  return user;
};

buildUser.withMembership = function buildUserWithMemberships({
  id,
  firstName = faker.name.firstName(),
  lastName = faker.name.lastName(),
  email = faker.internet.email(),
  password = 'encrypt.hashPasswordSync(faker.internet.password())',
  cgu = true,
  organizationRole = Membership.roles.OWNER,
  organizationId = null,
} = {}) {

  const values = {
    id, firstName, lastName, email, password, cgu,
  };

  organizationId = _.isNil(organizationId) ? buildOrganization().id : organizationId;

  const user = databaseBuffer.pushInsertable({
    tableName: 'users',
    values,
  });

  buildMembership({
    userId: user.id,
    organizationId,
    organizationRole,
  });

  return user;
};

module.exports = buildUser;
