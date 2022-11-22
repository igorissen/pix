const { expect, HttpTestServer, sinon } = require('../../../test-helper');

const securityPreHandlers = require('../../../../lib/application/security-pre-handlers');
const trainingController = require('../../../../lib/application/trainings/training-controller');
const moduleUnderTest = require('../../../../lib/application/trainings');

describe('Unit | Router | training-router', function () {
  describe('PATCH /api/admin/trainings', function () {
    // eslint-disable-next-line mocha/no-setup-in-describe
    [
      {
        role: 'SUPER_ADMIN',
        securityPreHandlersResponses: {
          checkAdminMemberHasRoleSuperAdmin: (request, h) => h.response(true),
          checkAdminMemberHasRoleMetier: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
        },
      },
      {
        role: 'METIER',
        securityPreHandlersResponses: {
          checkAdminMemberHasRoleSuperAdmin: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
          checkAdminMemberHasRoleMetier: (request, h) => h.response(true),
        },
      },
    ].forEach(({ role, securityPreHandlersResponses }) => {
      it(`should verify user identity and return success update when user role is "${role}"`, async function () {
        // given
        sinon.stub(trainingController, 'update').returns('ok');
        sinon
          .stub(securityPreHandlers, 'checkAdminMemberHasRoleSuperAdmin')
          .callsFake(securityPreHandlersResponses.checkAdminMemberHasRoleSuperAdmin);
        sinon
          .stub(securityPreHandlers, 'checkAdminMemberHasRoleMetier')
          .callsFake(securityPreHandlersResponses.checkAdminMemberHasRoleMetier);
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        const payloadAttributes = { title: 'new title' };
        const payload = { data: { attributes: payloadAttributes } };

        // when
        const result = await httpTestServer.request('PATCH', '/api/admin/trainings/12344', payload);

        // then
        sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleSuperAdmin);
        sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleMetier);
        sinon.assert.calledOnce(trainingController.update);
        expect(result.statusCode).to.equal(200);
      });
    });

    it('should return bad request when param id is not numeric', async function () {
      // given
      const httpTestServer = new HttpTestServer();
      await httpTestServer.register(moduleUnderTest);

      const payload = { data: { attributes: { title: 'new title' } } };

      // when
      const result = await httpTestServer.request('PATCH', '/api/admin/trainings/not_number', payload);

      // then
      expect(result.statusCode).to.equal(400);
    });

    it('should return bad request when payload is not provided', async function () {
      // given
      const httpTestServer = new HttpTestServer();
      await httpTestServer.register(moduleUnderTest);

      // when
      const result = await httpTestServer.request('PATCH', '/api/admin/trainings/12344');

      // then
      expect(result.statusCode).to.equal(400);
    });

    it(`should return 403 when user does not have access METIER`, async function () {
      // given
      sinon.stub(trainingController, 'update').returns('ok');
      sinon
        .stub(securityPreHandlers, 'checkAdminMemberHasRoleSuperAdmin')
        .callsFake((request, h) => h.response({ errors: new Error('forbidden') }).code(403));
      sinon
        .stub(securityPreHandlers, 'checkAdminMemberHasRoleMetier')
        .callsFake((request, h) => h.response({ errors: new Error('forbidden') }).code(403));
      const httpTestServer = new HttpTestServer();
      await httpTestServer.register(moduleUnderTest);

      const payloadAttributes = { title: 'new title' };
      const payload = { data: { attributes: payloadAttributes } };

      // when
      const result = await httpTestServer.request('PATCH', '/api/admin/trainings/12344', payload);

      // then
      sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleSuperAdmin);
      sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleMetier);
      sinon.assert.notCalled(trainingController.update);
      expect(result.statusCode).to.equal(403);
    });
  });

  describe('GET /api/admin/training-summaries', function () {
    const method = 'GET';
    const url = '/api/admin/training-summaries';

    context("when user has role 'SUPER_ADMIN', 'SUPPORT', 'METIER'", function () {
      // eslint-disable-next-line mocha/no-setup-in-describe
      [
        {
          role: 'SUPER_ADMIN',
          securityPreHandlersResponses: {
            checkAdminMemberHasRoleSuperAdmin: (request, h) => h.response(true),
            checkAdminMemberHasRoleMetier: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
            checkAdminMemberHasRoleSupport: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
          },
        },
        {
          role: 'METIER',
          securityPreHandlersResponses: {
            checkAdminMemberHasRoleSuperAdmin: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
            checkAdminMemberHasRoleMetier: (request, h) => h.response(true),
            checkAdminMemberHasRoleSupport: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
          },
        },
        {
          role: 'SUPPORT',
          securityPreHandlersResponses: {
            checkAdminMemberHasRoleSuperAdmin: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
            checkAdminMemberHasRoleMetier: (request, h) => h.response({ errors: new Error('forbidden') }).code(403),
            checkAdminMemberHasRoleSupport: (request, h) => h.response(true),
          },
        },
      ].forEach(({ role, securityPreHandlersResponses }) => {
        it(`should verify user identity and return success update when user role is "${role}"`, async function () {
          // given
          sinon.stub(trainingController, 'findPaginatedTrainingSummaries').returns('ok');
          sinon
            .stub(securityPreHandlers, 'checkAdminMemberHasRoleSuperAdmin')
            .callsFake(securityPreHandlersResponses.checkAdminMemberHasRoleSuperAdmin);
          sinon
            .stub(securityPreHandlers, 'checkAdminMemberHasRoleMetier')
            .callsFake(securityPreHandlersResponses.checkAdminMemberHasRoleMetier);
          sinon
            .stub(securityPreHandlers, 'checkAdminMemberHasRoleSupport')
            .callsFake(securityPreHandlersResponses.checkAdminMemberHasRoleSupport);
          const httpTestServer = new HttpTestServer();
          await httpTestServer.register(moduleUnderTest);

          // when
          const result = await httpTestServer.request(method, url);

          // then
          sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleSuperAdmin);
          sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleMetier);
          sinon.assert.calledOnce(securityPreHandlers.checkAdminMemberHasRoleSupport);
          sinon.assert.calledOnce(trainingController.findPaginatedTrainingSummaries);
          expect(result.statusCode).to.equal(200);
        });
      });
    });

    context('when user has role "CERTIF"', function () {
      it('should return a response with an HTTP status code 403', async function () {
        // given
        sinon
          .stub(securityPreHandlers, 'adminMemberHasAtLeastOneAccessOf')
          .withArgs([
            securityPreHandlers.checkAdminMemberHasRoleSuperAdmin,
            securityPreHandlers.checkAdminMemberHasRoleSupport,
            securityPreHandlers.checkAdminMemberHasRoleMetier,
          ])
          .callsFake(
            () => (request, h) =>
              h
                .response({ errors: new Error('forbidden') })
                .code(403)
                .takeover()
          );
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const result = await httpTestServer.request(method, url);

        // then
        expect(result.statusCode).to.equal(403);
      });
    });

    context('when there is no pagination', function () {
      it('should resolve with HTTP code 200', async function () {
        // given
        sinon.stub(securityPreHandlers, 'adminMemberHasAtLeastOneAccessOf').returns(() => true);
        sinon
          .stub(trainingController, 'findPaginatedTrainingSummaries')
          .callsFake((request, h) => h.response('ok').code(200));
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const result = await httpTestServer.request(method, url);

        // then
        expect(result.statusCode).to.equal(200);
      });
    });

    context('when there are pagination', function () {
      it('should resolve with HTTP code 200', async function () {
        // given
        sinon.stub(securityPreHandlers, 'adminMemberHasAtLeastOneAccessOf').returns(() => true);
        sinon
          .stub(trainingController, 'findPaginatedTrainingSummaries')
          .callsFake((request, h) => h.response('ok').code(200));
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(method, `${url}?page[size]=10&page[number]=1`);

        // then
        expect(response.statusCode).to.equal(200);
      });
    });

    context('when page size is not an integer', function () {
      it('should reject request with HTTP code 400', async function () {
        // given
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(method, `${url}?page[size]=azerty`);

        // then
        expect(response.statusCode).to.equal(400);
      });
    });

    context('when page number is not an integer', function () {
      it('should reject request with HTTP code 400', async function () {
        // given
        const httpTestServer = new HttpTestServer();
        await httpTestServer.register(moduleUnderTest);

        // when
        const response = await httpTestServer.request(method, `${url}?page[number]=azerty`);

        // then
        expect(response.statusCode).to.equal(400);
      });
    });
  });
});
