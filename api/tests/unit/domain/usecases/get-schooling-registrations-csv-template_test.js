const { expect, sinon, domainBuilder, catchErr } = require('../../../test-helper');
const getSchoolingRegistrationsCsvTemplate = require('../../../../lib/domain/usecases/get-schooling-registrations-csv-template');
const _ = require('lodash');
const { UserNotAuthorizedToAccessEntityError } = require('../../../../lib/domain/errors');
const { getI18n } = require('../../../tooling/i18n/i18n');

describe('Unit | UseCase | get-schooling-registrations-csv-template', () => {

  const userId = Symbol('userId');
  const organizationId = Symbol('organizationId');
  const membershipRepository = { findByUserIdAndOrganizationId: _.noop };
  const i18n = getI18n();

  context('When user is ADMIN in a SUP organization managing students', () => {
    it('should return headers line', async () => {
      // given
      const organization = domainBuilder.buildOrganization({ isManagingStudents: true, type: 'SUP' });
      const membership = domainBuilder.buildMembership({ organizationRole: 'ADMIN', organization });
      sinon.stub(membershipRepository, 'findByUserIdAndOrganizationId').resolves([membership]);

      // when
      const result = await getSchoolingRegistrationsCsvTemplate({ userId, organizationId, i18n, membershipRepository });

      // then
      const csvExpected = '\uFEFF"Premier prénom";' +
        '"Deuxième prénom";' +
        '"Troisième prénom";' +
        '"Nom de famille";' +
        '"Nom d\'usage";' +
        '"Date de naissance (jj/mm/aaaa)";' +
        '"Email";' +
        '"Numéro étudiant";' +
        '"Composante";' +
        '"Équipe pédagogique";' +
        '"Groupe";' +
        '"Diplôme";' +
        '"Régime"\n';
      expect(result).to.deep.equal(csvExpected);
    });
  });

  context('When user is ADMIN in a SUP organization not managing students', () => {
    it('should throw an error', async () => {
      // given
      sinon.stub(membershipRepository, 'findByUserIdAndOrganizationId').resolves([{ isAdmin: true, organization: { isManagingStudents: false, type: 'SUP' } }]);

      // when
      const error = await catchErr(getSchoolingRegistrationsCsvTemplate)({ userId, organizationId, membershipRepository });

      // then
      expect(error).to.be.instanceOf(UserNotAuthorizedToAccessEntityError);
    });
  });

  context('When user is not ADMIN in a SUP organization', () => {
    it('should throw an error', async () => {
      // given
      sinon.stub(membershipRepository, 'findByUserIdAndOrganizationId').resolves([{ isAdmin: false, organization: { isManagingStudents: true, type: 'SUP' } }]);

      // when
      const error = await catchErr(getSchoolingRegistrationsCsvTemplate)({ userId, organizationId, membershipRepository });

      // then
      expect(error).to.be.instanceOf(UserNotAuthorizedToAccessEntityError);
    });
  });

  context('When user is not a member of the organization', () => {
    it('should throw an error', async () => {
      // given
      sinon.stub(membershipRepository, 'findByUserIdAndOrganizationId').resolves([]);

      // when
      const error = await catchErr(getSchoolingRegistrationsCsvTemplate)({ userId, organizationId, membershipRepository });

      // then
      expect(error).to.be.instanceOf(UserNotAuthorizedToAccessEntityError);
    });
  });
});
