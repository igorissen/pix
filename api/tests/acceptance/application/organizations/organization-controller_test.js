const _ = require('lodash');
const dragonLogo = require('../../../../db/seeds/src/dragonAndCoBase64');

const {
  expect,
  knex,
  learningContentBuilder,
  databaseBuilder,
  mockLearningContent,
  generateValidRequestAuthorizationHeader,
  insertUserWithRolePixMaster,
} = require('../../../test-helper');

const createServer = require('../../../../server');

const Membership = require('../../../../lib/domain/models/Membership');
const OrganizationInvitation = require('../../../../lib/domain/models/OrganizationInvitation');
const Assessment = require('../../../../lib/domain/models/Assessment');
const AssessmentResult = require('../../../../lib/domain/models/AssessmentResult');

describe('Acceptance | Application | organization-controller', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
    await insertUserWithRolePixMaster();
  });

  describe('POST /api/organizations', function () {
    let payload;
    let options;

    beforeEach(function () {
      payload = {
        data: {
          type: 'organizations',
          attributes: {
            name: 'The name of the organization',
            type: 'PRO',
          },
        },
      };
      options = {
        method: 'POST',
        url: '/api/organizations',
        payload,
        headers: { authorization: generateValidRequestAuthorizationHeader() },
      };
    });

    afterEach(async function () {
      await knex('organizations').delete();
    });

    describe('Success case', function () {
      it('should return 200 HTTP status code', async function () {
        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
      });

      it('should create and return the new organization', async function () {
        // when
        const response = await server.inject(options);

        // then
        const createdOrganization = response.result.data.attributes;
        expect(createdOrganization.name).to.equal('The name of the organization');
        expect(createdOrganization.type).to.equal('PRO');
      });

      it('should save the Pix Master userId creating the Organization', async function () {
        // given
        const PIX_MASTER_ROLE_ID = 1;
        const pixMasterUserId = databaseBuilder.factory.buildUser().id;
        databaseBuilder.factory.buildUserPixRole({
          userId: pixMasterUserId,
          pixRoleId: PIX_MASTER_ROLE_ID,
        });
        await databaseBuilder.commit();

        options.headers.authorization = generateValidRequestAuthorizationHeader(pixMasterUserId);

        // when
        const response = await server.inject(options);

        // then
        const createdOrganization = response.result.data.attributes;
        expect(createdOrganization['created-by']).to.equal(pixMasterUserId);
      });
    });

    describe('when creating with a wrong payload (ex: organization type is wrong)', function () {
      it('should return 422 HTTP status code', async function () {
        // given
        payload.data.attributes.type = 'FAK';

        // then
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(422);
      });

      it('should not keep the user in the database', async function () {
        // given
        payload.data.attributes.type = 'FAK';

        // then
        const creatingOrganizationOnFailure = server.inject(options);

        // then
        return creatingOrganizationOnFailure.then(() => {
          return knex('users')
            .count('id as id')
            .then((count) => {
              expect(parseInt(count[0].id, 10)).to.equal(1);
            });
        });
      });
    });

    describe('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.statusCode).to.equal(401);
        });
      });

      it('should respond with a 403 - forbidden access - if user has not role PIX_MASTER', function () {
        // given
        const nonPixMAsterUserId = 9999;
        options.headers.authorization = generateValidRequestAuthorizationHeader(nonPixMAsterUserId);

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.statusCode).to.equal(403);
        });
      });
    });
  });

  describe('PATCH /api/organizations/{id}', function () {
    afterEach(async function () {
      await knex('organization-tags').delete();
    });

    it('should return the updated organization and status code 200', async function () {
      // given
      const logo = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
      const organizationAttributes = {
        externalId: '0446758F',
        provinceCode: '044',
        email: 'sco.generic.newaccount@example.net',
        credit: 50,
        canCollectProfiles: false,
        logoUrl: logo,
      };
      const organization = databaseBuilder.factory.buildOrganization({ ...organizationAttributes });
      const tag1 = databaseBuilder.factory.buildTag({ name: 'AGRICULTURE' });
      await databaseBuilder.commit();

      const newLogo = dragonLogo;
      const newAttribute = 'true';
      const payload = {
        data: {
          type: 'organizations',
          id: organization.id,
          attributes: {
            'external-id': organizationAttributes.externalId,
            'province-code': organizationAttributes.provinceCode,
            email: organizationAttributes.email,
            credit: organizationAttributes.credit,
            'can-collect-profiles': newAttribute,
            'logo-url': newLogo,
          },
          relationships: {
            tags: {
              data: [{ type: 'tags', id: tag1.id }],
            },
          },
        },
      };
      const options = {
        method: 'PATCH',
        url: `/api/organizations/${organization.id}`,
        payload,
        headers: { authorization: generateValidRequestAuthorizationHeader() },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data.attributes['external-id']).to.equal('0446758F');
      expect(response.result.data.attributes['province-code']).to.equal('044');
      expect(response.result.data.attributes['can-collect-profiles']).to.equal(true);
      expect(response.result.data.attributes['email']).to.equal('sco.generic.newaccount@example.net');
      expect(response.result.data.attributes['credit']).to.equal(50);
      expect(response.result.data.attributes['logo-url']).to.equal(newLogo);
      expect(response.result.data.relationships.tags.data[0]).to.deep.equal({ type: 'tags', id: tag1.id.toString() });
      expect(parseInt(response.result.data.id)).to.equal(organization.id);
    });

    describe('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', async function () {
        // given
        const organization = databaseBuilder.factory.buildOrganization({ canCollectProfiles: false });
        await databaseBuilder.commit();
        const payload = {
          data: {
            type: 'organizations',
            id: organization.id,
            attributes: {
              'external-id': '0446758F',
              'province-code': '044',
              email: 'sco.generic.newaccount@example.net',
              credit: 50,
              'can-collect-profiles': 'true',
            },
          },
        };
        const options = {
          method: 'PATCH',
          url: `/api/organizations/${organization.id}`,
          payload,
          headers: { authorization: 'invalid.access.token' },
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });

      it('should respond with a 403 - forbidden access - if user has not role PIX_MASTER', async function () {
        // given
        const nonPixMAsterUserId = 9999;
        const organization = databaseBuilder.factory.buildOrganization({ canCollectProfiles: false });
        await databaseBuilder.commit();
        const payload = {
          data: {
            type: 'organizations',
            id: organization.id,
            attributes: {
              'external-id': '0446758F',
              'province-code': '044',
              email: 'sco.generic.newaccount@example.net',
              credit: 50,
              'can-collect-profiles': 'true',
            },
          },
        };
        const options = {
          method: 'PATCH',
          url: `/api/organizations/${organization.id}`,
          payload,
          headers: { authorization: generateValidRequestAuthorizationHeader(nonPixMAsterUserId) },
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });
    });
  });

  describe('GET /api/organizations', function () {
    let server;
    let options;

    beforeEach(async function () {
      server = await createServer();

      const userPixMaster = databaseBuilder.factory.buildUser.withPixRolePixMaster();

      databaseBuilder.factory.buildOrganization({
        name: 'The name of the organization',
        type: 'SUP',
        externalId: '1234567A',
      });
      databaseBuilder.factory.buildOrganization({
        name: 'Organization of the night',
        type: 'PRO',
        externalId: '1234568A',
      });

      options = {
        method: 'GET',
        url: '/api/organizations',
        payload: {},
        headers: { authorization: generateValidRequestAuthorizationHeader(userPixMaster.id) },
      };

      return databaseBuilder.commit();
    });

    describe('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', async function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });

      it('should respond with a 403 - forbidden access - if user has not role PIX_MASTER', async function () {
        // given
        const nonPixMasterUserId = 9999;
        options.headers.authorization = generateValidRequestAuthorizationHeader(nonPixMasterUserId);

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });
    });

    describe('Success case', function () {
      it('should return a 200 status code response with JSON API serialized', async function () {
        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.data).to.have.lengthOf(2);
        expect(response.result.data[0].type).to.equal('organizations');
      });

      it('should return pagination meta data', async function () {
        // given
        const expectedMetaData = { page: 1, pageSize: 10, rowCount: 2, pageCount: 1 };

        // when
        const response = await server.inject(options);

        // then
        expect(response.result.meta).to.deep.equal(expectedMetaData);
      });

      it('should return a 200 status code with paginated and filtered data', async function () {
        // given
        options.url = '/api/organizations?filter[name]=orga&filter[externalId]=A&page[number]=2&page[size]=1';
        const expectedMetaData = { page: 2, pageSize: 1, rowCount: 2, pageCount: 2 };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.meta).to.deep.equal(expectedMetaData);
        expect(response.result.data).to.have.lengthOf(1);
        expect(response.result.data[0].type).to.equal('organizations');
      });

      it('should return a 200 status code with empty result', async function () {
        // given
        options.url =
          '/api/organizations?filter[name]=orga&filter[type]=sco&filter[externalId]=B&page[number]=1&page[size]=1';
        const expectedMetaData = { page: 1, pageSize: 1, rowCount: 0, pageCount: 0 };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.meta).to.deep.equal(expectedMetaData);
        expect(response.result.data).to.have.lengthOf(0);
      });
    });
  });

  describe('GET /api/organizations/{id}/campaigns', function () {
    let campaignsData;
    let organizationId, otherOrganizationId;
    let userId;
    let options;

    beforeEach(async function () {
      userId = databaseBuilder.factory.buildUser({}).id;
      organizationId = databaseBuilder.factory.buildOrganization({}).id;
      databaseBuilder.factory.buildMembership({ organizationId, userId });
      otherOrganizationId = databaseBuilder.factory.buildOrganization({}).id;
      campaignsData = _.map(
        [
          { name: 'Quand Peigne numba one', code: 'ATDGRK343', organizationId },
          { name: 'Quand Peigne numba two', code: 'KFCTSU984', organizationId },
          {
            name: 'Quand Peigne numba three',
            code: 'ABC180ELO',
            organizationId,
            archivedAt: new Date('2000-01-01T10:00:00Z'),
          },
          {
            name: 'Quand Peigne numba four',
            code: 'ABC180LEO',
            organizationId,
            archivedAt: new Date('2000-02-01T10:00:00Z'),
          },
          { name: 'Quand Peigne otha orga', code: 'CPFTQX735', organizationId: otherOrganizationId },
        ],
        (camp) => {
          const builtCampaign = databaseBuilder.factory.buildCampaign(camp);
          return { name: camp.name, code: camp.code, id: builtCampaign.id };
        }
      );
      databaseBuilder.factory.buildCampaignParticipation({ campaignId: campaignsData[4].id });
      await databaseBuilder.commit();

      options = {
        method: 'GET',
        url: `/api/organizations/${organizationId}/campaigns`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(userId),
        },
      };
    });

    context('Something is wrong', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.statusCode).to.equal(401);
        });
      });
    });

    context('when the user is not a member of the organization', function () {
      it('should respond with a 403', function () {
        // given
        userId = databaseBuilder.factory.buildUser({}).id;
        options = {
          method: 'GET',
          url: `/api/organizations/${organizationId}/campaigns`,
          headers: {
            authorization: generateValidRequestAuthorizationHeader(userId),
          },
        };

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.statusCode).to.equal(403);
        });
      });
    });

    context('Retrieve campaigns', function () {
      it('should return 200 status code the organization campaigns', async function () {
        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        const campaigns = response.result.data;
        expect(campaigns).to.have.lengthOf(2);
        expect(_.map(campaigns, 'attributes.name')).to.have.members([campaignsData[0].name, campaignsData[1].name]);
        expect(_.map(campaigns, 'attributes.code')).to.have.members([campaignsData[0].code, campaignsData[1].code]);
      });

      it('should return campaigns with its creator', async function () {
        // given
        organizationId = databaseBuilder.factory.buildOrganization({}).id;
        const creatorId = databaseBuilder.factory.buildUser({ firstName: 'Daenerys', lastName: 'Targaryen' }).id;
        databaseBuilder.factory.buildMembership({ organizationId, userId });
        databaseBuilder.factory.buildCampaign({ organizationId, creatorId });
        await databaseBuilder.commit();
        options.url = `/api/organizations/${organizationId}/campaigns`;

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.data[0].attributes['creator-first-name']).to.equal('Daenerys');
        expect(response.result.data[0].attributes['creator-last-name']).to.equal('Targaryen');
      });

      it('should return archived campaigns', async function () {
        // given
        options.url = `/api/organizations/${organizationId}/campaigns?page[number]=1&page[size]=2&filter[status]=archived`;
        const expectedMetaData = { page: 1, pageSize: 2, rowCount: 2, pageCount: 1, hasCampaigns: true };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.meta).to.deep.equal(expectedMetaData);
        expect(response.result.data).to.have.lengthOf(2);
        expect(response.result.data[0].type).to.equal('campaigns');
      });

      it('should return report with the campaigns', async function () {
        // given
        databaseBuilder.factory.buildMembership({ organizationId: otherOrganizationId, userId });
        await databaseBuilder.commit();
        options.url = `/api/organizations/${otherOrganizationId}/campaigns`;

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        const campaigns = response.result.data;
        expect(campaigns).to.have.lengthOf(1);
        expect(response.result.data[0].attributes['participations-count']).to.equal(1);
        expect(response.result.data[0].attributes['shared-participations-count']).to.equal(1);
      });

      it('should return default pagination meta data', async function () {
        // given
        const expectedMetaData = { page: 1, pageSize: 10, rowCount: 2, pageCount: 1, hasCampaigns: true };

        // when
        const response = await server.inject(options);

        // then
        expect(response.result.meta).to.deep.equal(expectedMetaData);
      });

      it('should return a 200 status code with paginated data', async function () {
        // given
        options.url = `/api/organizations/${organizationId}/campaigns?&page[number]=2&page[size]=1`;
        const expectedMetaData = { page: 2, pageSize: 1, rowCount: 2, pageCount: 2, hasCampaigns: true };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.meta).to.deep.equal(expectedMetaData);
        expect(response.result.data).to.have.lengthOf(1);
        expect(response.result.data[0].type).to.equal('campaigns');
      });

      it('should return a 200 status code with paginated and filtered data', async function () {
        // given
        options.url = `/api/organizations/${organizationId}/campaigns?filter[name]=Two&page[number]=1&page[size]=1`;
        const expectedMetaData = { page: 1, pageSize: 1, rowCount: 1, pageCount: 1, hasCampaigns: true };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.meta).to.deep.equal(expectedMetaData);
        expect(response.result.data).to.have.lengthOf(1);
        expect(response.result.data[0].type).to.equal('campaigns');
      });

      it('should return a 200 status code with empty result', async function () {
        // given
        options.url = `/api/organizations/${organizationId}/campaigns?&page[number]=3&page[size]=1`;
        const expectedMetaData = { page: 3, pageSize: 1, rowCount: 2, pageCount: 2, hasCampaigns: true };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.meta).to.deep.equal(expectedMetaData);
        expect(response.result.data).to.have.lengthOf(0);
      });
    });
  });

  describe('GET /api/organizations/{id}', function () {
    let organization;
    let options;
    let pixMasterUserId;

    context('Expected output', function () {
      beforeEach(async function () {
        pixMasterUserId = databaseBuilder.factory.buildUser.withPixRolePixMaster().id;

        organization = databaseBuilder.factory.buildOrganization({
          type: 'SCO',
          name: 'Organization catalina',
          logoUrl: 'some logo url',
          externalId: 'ABC123',
          provinceCode: '45',
          isManagingStudents: true,
          credit: 666,
          email: 'sco.generic.account@example.net',
          createdBy: pixMasterUserId,
        });

        await databaseBuilder.commit();

        options = {
          method: 'GET',
          url: `/api/organizations/${organization.id}`,
          headers: { authorization: generateValidRequestAuthorizationHeader(pixMasterUserId) },
        };
      });

      it('should return the matching organization as JSON API', async function () {
        // given
        const tag = databaseBuilder.factory.buildTag({ id: 7, name: 'AEFE' });
        databaseBuilder.factory.buildOrganizationTag({ tagId: tag.id, organizationId: organization.id });
        await databaseBuilder.commit();

        const expectedResult = {
          data: {
            attributes: {
              name: organization.name,
              type: organization.type,
              'logo-url': organization.logoUrl,
              'external-id': organization.externalId,
              'province-code': organization.provinceCode,
              'is-managing-students': organization.isManagingStudents,
              'can-collect-profiles': organization.canCollectProfiles,
              credit: organization.credit,
              email: organization.email,
              'created-by': pixMasterUserId,
            },
            id: organization.id.toString(),
            relationships: {
              memberships: {
                links: {
                  related: `/api/organizations/${organization.id}/memberships`,
                },
              },
              students: {
                links: {
                  related: `/api/organizations/${organization.id}/students`,
                },
              },
              tags: {
                data: [
                  {
                    id: tag.id.toString(),
                    type: 'tags',
                  },
                ],
              },
              'target-profiles': {
                links: {
                  related: `/api/organizations/${organization.id}/target-profiles`,
                },
              },
            },
            type: 'organizations',
          },
          included: [
            {
              attributes: {
                id: tag.id,
                name: tag.name,
              },
              id: tag.id.toString(),
              type: 'tags',
            },
          ],
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.result).to.deep.equal(expectedResult);
      });

      it('should return a 404 error when organization was not found', function () {
        // given
        options.url = '/api/organizations/999';

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.result).to.deep.equal({
            errors: [
              {
                status: '404',
                detail: 'Not found organization for ID 999',
                title: 'Not Found',
              },
            ],
          });
        });
      });
    });

    describe('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.statusCode).to.equal(401);
        });
      });

      it('should respond with a 403 - forbidden access - if user has not role PIX_MASTER', function () {
        // given
        const nonPixMAsterUserId = 9999;
        options.headers.authorization = generateValidRequestAuthorizationHeader(nonPixMAsterUserId);

        // when
        const promise = server.inject(options);

        // then
        return promise.then((response) => {
          expect(response.statusCode).to.equal(403);
        });
      });
    });
  });

  describe('GET /api/organizations/{id}/memberships', function () {
    let organization;
    let options;

    beforeEach(async function () {
      const userPixMaster = databaseBuilder.factory.buildUser.withPixRolePixMaster();
      organization = databaseBuilder.factory.buildOrganization();
      options = {
        method: 'GET',
        url: `/api/organizations/${organization.id}/memberships`,
        headers: { authorization: generateValidRequestAuthorizationHeader(userPixMaster.id) },
      };
    });

    context('Expected output', function () {
      let user;
      let membershipId;

      beforeEach(async function () {
        user = databaseBuilder.factory.buildUser();

        membershipId = databaseBuilder.factory.buildMembership({
          userId: user.id,
          organizationId: organization.id,
        }).id;

        await databaseBuilder.commit();
      });

      it('should return the matching membership as JSON API', async function () {
        // given
        const expectedResult = {
          data: [
            {
              attributes: {
                'organization-role': 'MEMBER',
              },
              id: membershipId.toString(),
              relationships: {
                user: {
                  data: {
                    id: user.id.toString(),
                    type: 'users',
                  },
                },
              },
              type: 'memberships',
            },
          ],
          included: [
            {
              attributes: {
                email: user.email,
                'first-name': user.firstName,
                'last-name': user.lastName,
              },
              id: user.id.toString(),
              type: 'users',
            },
          ],
          meta: {
            page: 1,
            pageCount: 1,
            pageSize: 10,
            rowCount: 1,
          },
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result).to.deep.equal(expectedResult);
      });
    });

    context('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', async function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });

      it('should respond with a 403 - forbidden access - if user is not in organization nor is PIXMASTER', async function () {
        // given
        const otherOrganizationId = databaseBuilder.factory.buildOrganization().id;
        const userId = databaseBuilder.factory.buildUser().id;
        databaseBuilder.factory.buildMembership({
          organizationRole: Membership.roles.MEMBER,
          organizationId: otherOrganizationId,
          userId,
        });

        await databaseBuilder.commit();

        options.headers.authorization = generateValidRequestAuthorizationHeader(userId);

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });
    });
  });

  describe('GET /api/organizations/{id}/students', function () {
    let user;
    let organization;
    let options;

    beforeEach(async function () {
      user = databaseBuilder.factory.buildUser();
      databaseBuilder.factory.buildAuthenticationMethod.withGarAsIdentityProvider({
        externalIdentifier: '234',
        userId: user.id,
      });
      organization = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true });
      databaseBuilder.factory.buildMembership({ organizationId: organization.id, userId: user.id });
      await databaseBuilder.commit();

      options = {
        method: 'GET',
        url: `/api/organizations/${organization.id}/students`,
        headers: { authorization: generateValidRequestAuthorizationHeader(user.id) },
      };
    });

    context('Expected output', function () {
      let schoolingRegistration;

      beforeEach(async function () {
        schoolingRegistration = databaseBuilder.factory.buildSchoolingRegistration({
          organizationId: organization.id,
          userId: user.id,
        });

        await databaseBuilder.commit();
      });

      it('should return the matching schoolingRegistrations as JSON API', async function () {
        // given
        const expectedResult = {
          data: [
            {
              attributes: {
                'last-name': schoolingRegistration.lastName,
                'first-name': schoolingRegistration.firstName,
                birthdate: schoolingRegistration.birthdate,
                'user-id': user.id,
                username: user.username,
                email: user.email,
                'is-authenticated-from-gar': true,
                'student-number': schoolingRegistration.studentNumber,
                division: schoolingRegistration.division,
                group: schoolingRegistration.group,
              },
              id: schoolingRegistration.id.toString(),
              type: 'students',
            },
          ],
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.data).to.deep.equal(expectedResult.data);
      });
    });

    context('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', async function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });

      it('should respond with a 403 - Forbidden access - if user does not belong to Organization', async function () {
        // given
        const userId = databaseBuilder.factory.buildUser.withMembership().id;
        await databaseBuilder.commit();
        options.headers.authorization = generateValidRequestAuthorizationHeader(userId);

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });

      it('should respond with a 403 - Forbidden access - if Organization does not manage schoolingRegistrations', async function () {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: false }).id;
        const userId = databaseBuilder.factory.buildUser.withMembership({ organizationId }).id;
        await databaseBuilder.commit();

        options.headers.authorization = generateValidRequestAuthorizationHeader(userId);
        options.url = `/api/organizations/${organizationId}/students`;

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });
    });
  });

  describe('POST /api/organizations/{id}/invitations', function () {
    let organization;
    let user1;
    let user2;
    let options;

    beforeEach(async function () {
      const adminUserId = databaseBuilder.factory.buildUser().id;
      organization = databaseBuilder.factory.buildOrganization();
      databaseBuilder.factory.buildMembership({
        userId: adminUserId,
        organizationId: organization.id,
        organizationRole: Membership.roles.ADMIN,
      });

      user1 = databaseBuilder.factory.buildUser();
      user2 = databaseBuilder.factory.buildUser();

      options = {
        method: 'POST',
        url: `/api/organizations/${organization.id}/invitations`,
        headers: { authorization: generateValidRequestAuthorizationHeader(adminUserId) },
        payload: {
          data: {
            type: 'organization-invitations',
            attributes: {
              email: `${user1.email},${user2.email}`,
            },
          },
        },
      };

      await databaseBuilder.commit();
    });

    afterEach(async function () {
      await knex('organization-invitations').delete();
    });

    context('Expected output', function () {
      it('should return the matching organization-invitations as JSON API', async function () {
        // given
        const status = OrganizationInvitation.StatusType.PENDING;
        const expectedResults = [
          {
            type: 'organization-invitations',
            attributes: {
              'organization-id': organization.id,
              email: user1.email,
              status,
            },
          },
          {
            type: 'organization-invitations',
            attributes: {
              'organization-id': organization.id,
              email: user2.email,
              status,
            },
          },
        ];

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(201);
        expect(response.result.data.length).equal(2);
        expect(
          _.omit(response.result.data[0], 'id', 'attributes.updated-at', 'attributes.organization-name')
        ).to.deep.equal(expectedResults[0]);
        expect(
          _.omit(response.result.data[1], 'id', 'attributes.updated-at', 'attributes.organization-name')
        ).to.deep.equal(expectedResults[1]);
      });
    });

    context('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', async function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });

      it('should respond with a 403 - forbidden access - if user is not ADMIN in organization', async function () {
        // given
        const nonAdminUserId = databaseBuilder.factory.buildUser().id;
        await databaseBuilder.commit();
        options.headers.authorization = generateValidRequestAuthorizationHeader(nonAdminUserId);

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });

      it('should respond with a 201 - created - if user is ADMIN in organization', async function () {
        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(201);
      });
    });
  });

  describe('GET /api/organizations/{id}/invitations', function () {
    let organizationId;
    let options;
    let firstOrganizationInvitation;
    let secondOrganizationInvitation;

    beforeEach(async function () {
      const adminUserId = databaseBuilder.factory.buildUser().id;
      organizationId = databaseBuilder.factory.buildOrganization().id;

      databaseBuilder.factory.buildMembership({
        userId: adminUserId,
        organizationId,
        organizationRole: Membership.roles.ADMIN,
      });

      firstOrganizationInvitation = databaseBuilder.factory.buildOrganizationInvitation({
        organizationId,
        status: OrganizationInvitation.StatusType.PENDING,
      });

      secondOrganizationInvitation = databaseBuilder.factory.buildOrganizationInvitation({
        organizationId,
        status: OrganizationInvitation.StatusType.PENDING,
      });

      databaseBuilder.factory.buildOrganizationInvitation({
        organizationId,
        status: OrganizationInvitation.StatusType.ACCEPTED,
      });

      options = {
        method: 'GET',
        url: `/api/organizations/${organizationId}/invitations`,
        headers: { authorization: generateValidRequestAuthorizationHeader(adminUserId) },
      };

      await databaseBuilder.commit();
    });

    afterEach(async function () {
      await knex('memberships').delete();
      await knex('organization-invitations').delete();
    });

    context('Expected output', function () {
      it('should return the matching organization-invitations as JSON API', async function () {
        // given
        const expectedResult = {
          data: [
            {
              type: 'organization-invitations',
              attributes: {
                'organization-id': organizationId,
                email: firstOrganizationInvitation.email,
                status: OrganizationInvitation.StatusType.PENDING,
                'updated-at': firstOrganizationInvitation.updatedAt,
              },
            },
            {
              type: 'organization-invitations',
              attributes: {
                'organization-id': organizationId,
                email: secondOrganizationInvitation.email,
                status: OrganizationInvitation.StatusType.PENDING,
                'updated-at': secondOrganizationInvitation.updatedAt,
              },
            },
          ],
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        const omittedResult = _.omit(
          response.result,
          'data[0].id',
          'data[0].attributes.organization-name',
          'data[1].id',
          'data[1].attributes.organization-name'
        );
        expect(omittedResult.data).to.deep.have.members(expectedResult.data);
      });
    });

    context('Resource access management', function () {
      it('should respond with a 401 - unauthorized access - if user is not authenticated', async function () {
        // given
        options.headers.authorization = 'invalid.access.token';

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });

      it('should respond with a 403 - forbidden access - if user is not ADMIN in organization', async function () {
        // given
        const nonPixMasterUserId = databaseBuilder.factory.buildUser().id;
        await databaseBuilder.commit();
        options.headers.authorization = generateValidRequestAuthorizationHeader(nonPixMasterUserId);

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403);
      });
    });
  });

  describe('GET /api/organizations/{id}/target-profiles', function () {
    context('when user is authenticated', function () {
      let user;
      let linkedOrganization;

      beforeEach(async function () {
        const learningContent = [
          {
            id: 'recArea0',
            competences: [
              {
                id: 'recNv8qhaY887jQb2',
                index: '1.3',
                name: 'Traiter des données',
              },
            ],
          },
        ];
        const learningContentObjects = learningContentBuilder.buildLearningContent(learningContent);
        mockLearningContent(learningContentObjects);

        user = databaseBuilder.factory.buildUser({});
        linkedOrganization = databaseBuilder.factory.buildOrganization({});
        databaseBuilder.factory.buildMembership({
          userId: user.id,
          organizationId: linkedOrganization.id,
        });

        await databaseBuilder.commit();
      });

      it('should return 200', async function () {
        const options = {
          method: 'GET',
          url: `/api/organizations/${linkedOrganization.id}/target-profiles`,
          headers: { authorization: generateValidRequestAuthorizationHeader(user.id) },
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
      });
    });

    context('when user is not authenticated', function () {
      it('should return 401', async function () {
        const options = {
          method: 'GET',
          url: '/api/organizations/1/target-profiles',
          headers: { authorization: 'Bearer mauvais token' },
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
      });
    });
  });

  describe('POST /api/organizations/{id}/target-profiles', function () {
    let payload;
    let options;

    let userId;
    let organizationId;
    let targetProfileId1;
    let targetProfileId2;

    beforeEach(async function () {
      userId = databaseBuilder.factory.buildUser.withPixRolePixMaster().id;
      organizationId = databaseBuilder.factory.buildOrganization().id;
      targetProfileId1 = databaseBuilder.factory.buildTargetProfile().id;
      targetProfileId2 = databaseBuilder.factory.buildTargetProfile().id;

      await databaseBuilder.commit();

      payload = {
        data: {
          type: 'target-profile-share',
          attributes: {
            'target-profiles-to-attach': [targetProfileId1, targetProfileId2],
          },
        },
      };
      options = {
        method: 'POST',
        url: `/api/organizations/${organizationId}/target-profiles`,
        payload,
        headers: { authorization: generateValidRequestAuthorizationHeader(userId) },
      };
    });

    afterEach(async function () {
      await knex('target-profile-shares').delete();
    });

    it('should create target profile share related to organization', async function () {
      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(201);
      const targetProfileShares = await knex('target-profile-shares').where({ organizationId });
      expect(targetProfileShares).to.have.lengthOf(2);
      expect(_.map(targetProfileShares, 'targetProfileId')).to.have.members([targetProfileId1, targetProfileId2]);
    });

    it('should return a 404 error and insert none of the target profiles', async function () {
      // given
      payload.data.attributes['target-profiles-to-attach'] = [targetProfileId1, targetProfileId2, '999'];
      options.payload = payload;

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(404);
      const targetProfileShares = await knex('target-profile-shares').where({ organizationId });
      expect(targetProfileShares).to.have.lengthOf(0);
    });
  });

  describe('GET /api/organizations/{id}/schooling-registrations/csv-template', function () {
    let userId, organization, accessToken;

    beforeEach(async function () {
      userId = databaseBuilder.factory.buildUser().id;
      const authHeader = generateValidRequestAuthorizationHeader(userId);
      accessToken = authHeader.replace('Bearer ', '');
    });

    context('when it‘s a SUP organization', function () {
      beforeEach(async function () {
        organization = databaseBuilder.factory.buildOrganization({ type: 'SUP', isManagingStudents: true });
        databaseBuilder.factory.buildMembership({
          userId,
          organizationId: organization.id,
          organizationRole: Membership.roles.ADMIN,
        });
        await databaseBuilder.commit();
      });

      it('should return csv file with statusCode 200', async function () {
        // given
        const options = {
          method: 'GET',
          url: `/api/organizations/${organization.id}/schooling-registrations/csv-template?accessToken=${accessToken}`,
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200, response.payload);
      });
    });

    context('when it‘s not a valid organization', function () {
      beforeEach(async function () {
        organization = databaseBuilder.factory.buildOrganization({ type: 'PRO' });
        databaseBuilder.factory.buildMembership({
          userId,
          organizationId: organization.id,
          organizationRole: Membership.roles.ADMIN,
        });
        await databaseBuilder.commit();
      });

      it('should return an error with statusCode 403', async function () {
        // given
        const options = {
          method: 'GET',
          url: `/api/organizations/${organization.id}/schooling-registrations/csv-template?accessToken=${accessToken}`,
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(403, response.payload);
      });
    });
  });

  describe('GET /api/organizations/{id}/certification-results', function () {
    it('should return HTTP status 200', async function () {
      // given

      const user = databaseBuilder.factory.buildUser.withRawPassword();

      const organization = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true });
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: user.id,
        organizationRole: Membership.roles.ADMIN,
      });

      const schoolingRegistration = databaseBuilder.factory.buildSchoolingRegistration({
        organizationId: organization.id,
        division: 'aDivision',
      });
      const candidate = databaseBuilder.factory.buildCertificationCandidate({
        schoolingRegistrationId: schoolingRegistration.id,
      });
      const certificationCourse = databaseBuilder.factory.buildCertificationCourse({
        userId: candidate.userId,
        sessionId: candidate.sessionId,
        isPublished: true,
      });

      const assessment = databaseBuilder.factory.buildAssessment({ certificationCourseId: certificationCourse.id });
      databaseBuilder.factory.buildAssessmentResult({ assessmentId: assessment.id });

      await databaseBuilder.commit();

      const options = {
        method: 'GET',
        url: `/api/organizations/${organization.id}/certification-results?division=aDivision`,
        headers: { authorization: generateValidRequestAuthorizationHeader(user.id) },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
    });
  });

  describe('GET /api/organizations/{id}/certification-attestations', function () {
    beforeEach(function () {
      const learningContent = [
        {
          id: 'recArea0',
          code: '1',
          competences: [
            {
              id: 'recNv8qhaY887jQb2',
              index: '1.3',
              name: 'Traiter des données',
            },
          ],
        },
      ];
      const learningContentObjects = learningContentBuilder.buildLearningContent(learningContent);
      mockLearningContent(learningContentObjects);
    });

    it('should return HTTP status 200', async function () {
      // given

      const adminIsManagingStudent = databaseBuilder.factory.buildUser.withRawPassword();

      const organization = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true });
      databaseBuilder.factory.buildMembership({
        organizationId: organization.id,
        userId: adminIsManagingStudent.id,
        organizationRole: Membership.roles.ADMIN,
      });

      const student = databaseBuilder.factory.buildUser.withRawPassword();
      const schoolingRegistration = databaseBuilder.factory.buildSchoolingRegistration({
        organizationId: organization.id,
        division: 'aDivision',
        userId: student.id,
      });

      const candidate = databaseBuilder.factory.buildCertificationCandidate({
        schoolingRegistrationId: schoolingRegistration.id,
        userId: student.id,
      });

      const certificationCourse = databaseBuilder.factory.buildCertificationCourse({
        userId: candidate.userId,
        sessionId: candidate.sessionId,
        isPublished: true,
        isCancelled: false,
      });

      const badge = databaseBuilder.factory.buildBadge({ key: 'a badge' });

      const assessment = databaseBuilder.factory.buildAssessment({
        userId: candidate.userId,
        certificationCourseId: certificationCourse.id,
        type: Assessment.types.CERTIFICATION,
        state: 'completed',
      });

      const assessmentResult = databaseBuilder.factory.buildAssessmentResult({
        assessmentId: assessment.id,
        status: AssessmentResult.status.VALIDATED,
      });
      databaseBuilder.factory.buildCompetenceMark({
        level: 3,
        score: 23,
        area_code: '1',
        competence_code: '1.3',
        assessmentResultId: assessmentResult.id,
        acquiredPartnerCertifications: [badge.key],
      });

      await databaseBuilder.commit();

      const options = {
        method: 'GET',
        url: `/api/organizations/${organization.id}/certification-attestations?division=aDivision`,
        headers: { authorization: generateValidRequestAuthorizationHeader(adminIsManagingStudent.id) },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
    });
  });

  describe('GET /api/organization/{organizationId}/divisions', function () {
    it('should return the divisions', async function () {
      // given
      const userId = databaseBuilder.factory.buildUser().id;
      const organization = databaseBuilder.factory.buildOrganization({ type: 'SCO', isManagingStudents: true });
      databaseBuilder.factory.buildMembership({
        userId,
        organizationId: organization.id,
        organizationRole: Membership.roles.ADMIN,
      });

      _buildSchoolingRegistrations(
        organization,
        { id: 1, division: '2ndB', firstName: 'Laura', lastName: 'Certif4Ever' },
        { id: 2, division: '2ndA', firstName: 'Laura', lastName: 'Booooo' },
        { id: 3, division: '2ndA', firstName: 'Laura', lastName: 'aaaaa' },
        { id: 4, division: '2ndA', firstName: 'Bart', lastName: 'Coucou' },
        { id: 5, division: '2ndA', firstName: 'Arthur', lastName: 'Coucou' }
      );

      await databaseBuilder.commit();

      const request = {
        method: 'GET',
        url: '/api/organizations/' + organization.id + '/divisions',
        headers: { authorization: generateValidRequestAuthorizationHeader(userId) },
      };

      // when
      const response = await server.inject(request);

      // then
      expect(response.statusCode).to.equal(200);
    });
  });
});

function _buildSchoolingRegistrations(organization, ...students) {
  return students.map((student) =>
    databaseBuilder.factory.buildSchoolingRegistration({ organizationId: organization.id, ...student })
  );
}
