import { securityPreHandlers } from '../../../shared/application/security-pre-handlers.js';
import { complementaryCertificationController } from './complementary-certification-controller.js';

const register = async function (server) {
  server.route([
    {
      method: 'GET',
      path: '/api/admin/complementary-certifications/{id}/target-profiles',
      config: {
        pre: [
          {
            method: (request, h) =>
              securityPreHandlers.hasAtLeastOneAccessOf([
                securityPreHandlers.checkAdminMemberHasRoleSuperAdmin,
                securityPreHandlers.checkAdminMemberHasRoleSupport,
                securityPreHandlers.checkAdminMemberHasRoleMetier,
                securityPreHandlers.checkAdminMemberHasRoleCertif,
              ])(request, h),
            assign: 'hasAuthorizationToAccessAdminScope',
          },
        ],
        handler: complementaryCertificationController.getComplementaryCertificationTargetProfileHistory,
        tags: ['api', 'admin'],
        notes: [
          'Cette route est restreinte aux utilisateurs authentifiés avec le rôle Super Admin, Support et Métier',
          "Elle renvoie les profils cibles courants et ses badges associés, ainsi que l'historique des profils cibles qui ont été rattachés à la certification complémentaire.",
        ],
      },
    },
  ]);
};

const name = 'src-complementary-certifications-api';
export { name, register };
