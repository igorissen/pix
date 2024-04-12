import { Issuer } from 'openid-client';

import { AuthenticationMethod } from '../../../../../lib/domain/models/AuthenticationMethod.js';
import { PoleEmploiOidcAuthenticationService } from '../../../../../lib/domain/services/authentication/pole-emploi-oidc-authentication-service.js';
import { config as settings } from '../../../../../src/shared/config.js';
import { expect, sinon } from '../../../../test-helper.js';

describe('Unit | Domain | Services | pole-emploi-oidc-authentication-service', function () {
  describe('#createClient', function () {
    it('creates an openid client with extra metadata', async function () {
      // given
      const Client = sinon.spy();

      sinon.stub(Issuer, 'discover').resolves({ Client });
      sinon.stub(settings, 'poleEmploi').value(settings.oidcExampleNet);

      const poleEmploiOidcAuthenticationService = new PoleEmploiOidcAuthenticationService();

      // when
      await poleEmploiOidcAuthenticationService.createClient();

      // then
      expect(Issuer.discover).to.have.been.calledWithExactly(
        'https://oidc.example.net/.well-known/openid-configuration',
      );
      expect(Client).to.have.been.calledWithNew;
      expect(Client).to.have.been.calledWithExactly({
        client_id: 'client',
        client_secret: 'secret',
        redirect_uris: ['https://app.dev.pix.local/connexion/oidc-example-net'],
        token_endpoint_auth_method: 'client_secret_post',
      });
    });
  });

  describe('#createAuthenticationComplement', function () {
    it('should create pole emploi authentication complement', function () {
      // given
      const sessionContent = {
        accessToken: 'accessToken',
        idToken: 'idToken',
        expiresIn: 10,
        refreshToken: 'refreshToken',
      };
      const poleEmploiOidcAuthenticationService = new PoleEmploiOidcAuthenticationService();

      // when
      const result = poleEmploiOidcAuthenticationService.createAuthenticationComplement({ sessionContent });

      // then
      expect(result).to.be.instanceOf(AuthenticationMethod.PoleEmploiOidcAuthenticationComplement);
    });
  });
});
