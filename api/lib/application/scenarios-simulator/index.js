import Joi from 'joi';
import { securityPreHandlers } from '../security-pre-handlers.js';
import { scenarioSimulatorController } from './scenario-simulator-controller.js';

const register = async (server) => {
  server.route([
    {
      method: 'POST',
      path: '/api/scenario-simulator',
      config: {
        pre: [
          {
            method: securityPreHandlers.checkAdminMemberHasRoleSuperAdmin,
            assign: 'hasAuthorizationToAccessAdminScope',
          },
        ],
        validate: {
          options: {
            allowUnknown: true,
          },
          payload: Joi.object({
            assessmentId: Joi.string().required(),
            simulationAnswers: Joi.array().items(Joi.string().allow('ok', 'ko', 'aband')).required(),
          }).required(),
        },
        handler: scenarioSimulatorController.simulateFlashDeterministicAssessmentScenario,
        tags: ['api'],
        notes: [
          'Cette route est restreinte aux utilisateurs authentifiés',
          'Elle renvoie la liste de challenges passés avec le nouvel algorithme ainsi que le niveau estimé, pour une liste de réponses données',
        ],
      },
    },
  ]);
};

const name = 'scenario-simulator-api';
export { register, name };
