import { oidcAuthenticationServiceRegistry } from '../lib/domain/services/authentication/authentication-service-registry.js';
import { CnavOidcAuthenticationService } from '../lib/domain/services/authentication/cnav-oidc-authentication-service.js';
import { FwbOidcAuthenticationService } from '../lib/domain/services/authentication/fwb-oidc-authentication-service.js';
import { GoogleOidcAuthenticationService } from '../lib/domain/services/authentication/GoogleOidcAuthenticationService.js';
import { PaysdelaloireOidcAuthenticationService } from '../lib/domain/services/authentication/paysdelaloire-oidc-authentication-service.js';
import { PoleEmploiOidcAuthenticationService } from '../lib/domain/services/authentication/pole-emploi-oidc-authentication-service.js';

function setupOidcAuthenticationServiceRegistry(oidcProviderServices) {
  const defaultOidcProviderServices = [
    new CnavOidcAuthenticationService(),
    new FwbOidcAuthenticationService(),
    new GoogleOidcAuthenticationService(),
    new PaysdelaloireOidcAuthenticationService(),
    new PoleEmploiOidcAuthenticationService(),
  ];
  const availableOidcProviderServices = oidcProviderServices ?? defaultOidcProviderServices;

  oidcAuthenticationServiceRegistry.loadOidcProviderServices(availableOidcProviderServices);
}

export { setupOidcAuthenticationServiceRegistry };
