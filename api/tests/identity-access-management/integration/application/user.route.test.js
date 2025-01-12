import { identityAccessManagementRoutes } from '../../../../src/identity-access-management/application/routes.js';
import * as i18nPlugin from '../../../../src/shared/infrastructure/plugins/i18n.js';
import { expect, HttpTestServer } from '../../../test-helper.js';

const routesUnderTest = identityAccessManagementRoutes[0];

describe('Integration | Identity Access Management | Application | Route | User', function () {
  let httpTestServer;

  beforeEach(async function () {
    httpTestServer = new HttpTestServer();
    await httpTestServer.register(i18nPlugin);
    await httpTestServer.register(routesUnderTest);
  });

  describe('POST /api/users', function () {
    context('when user create account before joining campaign', function () {
      it('should return HTTP 201', async function () {
        // given / when
        const response = await httpTestServer.request('POST', '/api/users', {
          data: {
            attributes: {
              'first-name': 'marine',
              'last-name': 'test',
              email: 'test1@example.net',
              username: null,
              password: 'Password123',
              cgu: true,
              'must-validate-terms-of-service': false,
              'has-seen-assessment-instructions': false,
              'has-seen-new-dashboard-info': false,
              lang: 'fr',
              'is-anonymous': false,
            },
            type: 'users',
          },
          meta: {
            'campaign-code': 'TRWYWV411',
          },
        });

        // then
        expect(response.statusCode).to.equal(201);
      });

      it('should return HTTP 400', async function () {
        // given
        const payload = {};

        const url = '/api/users';

        // when
        const response = await httpTestServer.request('POST', url, payload);

        // then
        expect(response.statusCode).to.equal(400);
      });
    });
  });

  describe('GET /api/user/validate-email', function () {
    context('when redirect_url is invalid', function () {
      it('should return HTTP 400 if not a URI', async function () {
        // when
        const response = await httpTestServer.request('GET', '/api/users/validate-email?redirect_url=XXX');

        // then
        expect(response.statusCode).to.equal(400);
      });

      it('should return HTTP 400 if not a https URI', async function () {
        // when
        const response = await httpTestServer.request('GET', '/api/users/validate-email?redirect_url=http://test.com');

        // then
        expect(response.statusCode).to.equal(400);
      });
    });

    context('when token is invalid', function () {
      it('should return HTTP 400', async function () {
        // when
        const response = await httpTestServer.request('GET', '/api/users/validate-email?token=XXX');

        // then
        expect(response.statusCode).to.equal(400);
      });
    });
  });
});
