import Joi from 'joi';

import { identifiersType } from '../../../shared/domain/types/identifiers-type.js';
import { campaignController } from './campaign-controller.js';

const register = async function (server) {
  server.route([
    {
      method: 'GET',
      path: '/api/campaigns/{campaignId}/divisions',
      config: {
        validate: {
          params: Joi.object({
            campaignId: identifiersType.campaignId,
          }),
        },
        handler: campaignController.division,
        notes: [
          '- **Cette route est restreinte aux utilisateurs authentifiés**\n' +
            '- Récupération des classes des participants à la campagne',
        ],
        tags: ['api', 'division'],
      },
    },
  ]);
};

const name = 'campaign-api';
export { name, register };