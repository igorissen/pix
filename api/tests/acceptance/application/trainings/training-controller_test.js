const {
  databaseBuilder,
  expect,
  generateValidRequestAuthorizationHeader,
  insertUserWithRoleSuperAdmin,
  knex,
} = require('../../../test-helper');
const createServer = require('../../../../server');

describe('Acceptance | Controller | training-controller', function () {
  let server;

  beforeEach(async function () {
    server = await createServer();
  });

  describe('GET /api/admin/trainings/{trainingId}', function () {
    it('should get a training with the specific id', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();
      databaseBuilder.factory.buildTraining();
      const { id: trainingId, ...trainingAttributes } = databaseBuilder.factory.buildTraining();
      await databaseBuilder.commit();

      const expectedResponse = {
        type: 'trainings',
        id: `${trainingId}`,
        attributes: {
          title: trainingAttributes.title,
          type: trainingAttributes.type,
          link: trainingAttributes.link,
          locale: trainingAttributes.locale,
          duration: {
            hours: 6,
          },
          'editor-logo-url': trainingAttributes.editorLogoUrl,
          'editor-name': trainingAttributes.editorName,
          'goal-threshold': trainingAttributes.goalThreshold,
          'prerequisite-threshold': trainingAttributes.prerequisiteThreshold,
        },
      };

      // when
      const response = await server.inject({
        method: 'GET',
        url: `/api/admin/trainings/${trainingId}`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(superAdmin.id),
        },
      });

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data.type).to.equal(expectedResponse.type);
      expect(response.result.data.id).to.equal(expectedResponse.id);
      expect(response.result.data.attributes).to.deep.equal(expectedResponse.attributes);
    });
  });

  describe('POST /api/admin/trainings', function () {
    afterEach(async function () {
      await databaseBuilder.knex('account-recovery-demands').delete();
    });

    it('should create a new training and response with a 201', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();

      const expectedResponse = {
        type: 'trainings',
        id: '101064',
        attributes: {
          title: 'Titre du training',
          link: 'https://training-link.org',
          type: 'webinaire',
          duration: {
            hours: 6,
          },
          locale: 'fr',
          'editor-name': 'Un ministère',
          'editor-logo-url': 'https://mon-logo.svg',
          'prerequisite-threshold': null,
          'goal-threshold': null,
        },
      };

      // when
      const response = await server.inject({
        method: 'POST',
        url: '/api/admin/trainings',
        payload: {
          data: {
            type: 'trainings',
            attributes: {
              title: 'Titre du training',
              link: 'https://training-link.org',
              type: 'webinaire',
              duration: {
                hours: 6,
              },
              locale: 'fr',
              'editor-logo-url': 'https://mon-logo.svg',
              'editor-name': 'Un ministère',
            },
          },
        },
        headers: { authorization: generateValidRequestAuthorizationHeader(superAdmin.id) },
      });

      // then
      expect(response.statusCode).to.equal(201);
      expect(response.result.data.type).to.equal(expectedResponse.type);
      expect(response.result.data.id).to.exist;
      expect(response.result.data.attributes).to.deep.equal(expectedResponse.attributes);
    });
  });

  describe('PATCH /api/admin/trainings/{trainingId}', function () {
    let options;

    describe('nominal case', function () {
      it('should update training and response with a 200', async function () {
        // given
        const superAdmin = await insertUserWithRoleSuperAdmin();
        const training = databaseBuilder.factory.buildTraining();
        await databaseBuilder.commit();
        const updatedTraining = {
          title: 'new title',
          editorName: 'editor name',
          editorLogoUrl: 'https://images.pix.fr/contenu-formatif/editeur/logo.svg',
          duration: {
            days: 2,
            hours: 2,
            minutes: 2,
          },
        };

        options = {
          method: 'PATCH',
          url: `/api/admin/trainings/${training.id}`,
          headers: {
            authorization: generateValidRequestAuthorizationHeader(superAdmin.id),
          },
          payload: {
            data: {
              type: 'trainings',
              attributes: {
                title: updatedTraining.title,
                'editor-name': updatedTraining.editorName,
                'editor-logo-url': updatedTraining.editorLogoUrl,
                duration: {
                  days: 2,
                  hours: 2,
                  minutes: 2,
                },
              },
            },
          },
        };

        const expectedResponse = {
          data: {
            type: 'trainings',
            id: '1',
            attributes: {
              title: updatedTraining.title,
              link: training.link,
              duration: training.duration,
              editorName: updatedTraining.editorName,
              editorLogoUrl: updatedTraining.editorLogoUrl,
            },
          },
        };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.data.type).to.deep.equal(expectedResponse.data.type);
        expect(response.result.data.id).to.exist;
        expect(response.result.data.attributes.title).to.deep.equal(expectedResponse.data.attributes.title);
        expect(response.result.data.attributes.link).to.deep.equal(expectedResponse.data.attributes.link);
        expect(response.result.data.attributes['editor-name']).to.deep.equal(
          expectedResponse.data.attributes.editorName
        );
        expect(response.result.data.attributes['editor-logo-url']).to.deep.equal(
          expectedResponse.data.attributes.editorLogoUrl
        );
      });
    });
  });

  describe('GET /api/admin/training-summaries', function () {
    let options;

    describe('nominal case', function () {
      it('should find training summaries and respond with a 200', async function () {
        // given
        const superAdmin = await insertUserWithRoleSuperAdmin();
        const training = databaseBuilder.factory.buildTraining();
        await databaseBuilder.commit();

        options = {
          method: 'GET',
          url: `/api/admin/training-summaries?page[number]=1&page[size]=2`,
          headers: {
            authorization: generateValidRequestAuthorizationHeader(superAdmin.id),
          },
        };

        const expectedResponse = {
          data: {
            type: 'training-summaries',
            id: '1',
            attributes: {
              title: training.title,
            },
          },
        };

        const expectedPagination = { page: 1, pageSize: 2, rowCount: 1, pageCount: 1 };

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(200);
        expect(response.result.data[0].type).to.deep.equal(expectedResponse.data.type);
        expect(response.result.data[0].id).to.exist;
        expect(response.result.data[0].attributes.title).to.deep.equal(expectedResponse.data.attributes.title);
        expect(response.result.meta.pagination).to.deep.equal(expectedPagination);
      });
    });
  });

  describe('PUT /api/admin/trainings/{trainingId}/triggers', function () {
    afterEach(async function () {
      await knex('training-trigger-tubes').delete();
      await knex('training-triggers').delete();
    });

    it('should update training trigger', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();
      const trainingId = databaseBuilder.factory.buildTraining().id;
      const tube = { id: 'recTube123', level: 2 };
      await databaseBuilder.commit();

      const options = {
        method: 'PUT',
        url: `/api/admin/trainings/${trainingId}/triggers`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(superAdmin.id),
        },
        payload: {
          data: {
            type: 'training-triggers',
            attributes: {
              trainingId: `${trainingId}`,
              type: 'prerequisite',
              threshold: 30,
            },
            relationships: {
              tubes: {
                data: [
                  {
                    id: `${tube.id}`,
                    type: 'tubes',
                  },
                ],
              },
            },
          },
          included: [
            {
              attributes: {
                id: `${tube.id}`,
                level: `${tube.level}`,
              },
              id: `${tube.id}`,
              type: 'tubes',
            },
          ],
        },
      };

      const expectedResponse = {
        data: {
          type: 'training-triggers',
          id: `${trainingId}`,
          attributes: {
            type: 'prerequisite',
            threshold: 30,
          },
          relationships: {
            tubes: { data: [{ id: 'recTube123', level: 2 }] },
          },
        },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data.type).to.deep.equal(expectedResponse.data.type);
      expect(response.result.data.id).to.exist;
      expect(response.result.data.attributes.type).to.deep.equal(expectedResponse.data.attributes.type);
      expect(response.result.data.attributes.threshold).to.deep.equal(expectedResponse.data.attributes.threshold);
      expect(response.result.data.relationships.tubes.data[0].id).to.deep.equal(
        expectedResponse.data.relationships.tubes.data[0].id
      );
      expect(response.result.data.attributes.level).to.deep.equal(expectedResponse.data.attributes.level);
    });
  });

  describe('GET /api/admin/trainings/{trainingId}/target-profile-summaries', function () {
    it('should get target-profile-summaries related to training id', async function () {
      // given
      const superAdmin = await insertUserWithRoleSuperAdmin();
      const training = databaseBuilder.factory.buildTraining();
      const targetProfile = databaseBuilder.factory.buildTargetProfile({
        id: 1,
        name: 'Super profil cible',
        isPublic: true,
        outdated: false,
      });
      databaseBuilder.factory.buildTargetProfileTraining({
        trainingId: training.id,
        targetProfileId: targetProfile.id,
      });
      await databaseBuilder.commit();

      const expectedResponse = {
        type: 'target-profile-summaries',
        id: `${targetProfile.id}`,
        attributes: {
          name: targetProfile.name,
          outdated: false,
        },
      };

      // when
      const response = await server.inject({
        method: 'GET',
        url: `/api/admin/trainings/${training.id}/target-profile-summaries`,
        headers: {
          authorization: generateValidRequestAuthorizationHeader(superAdmin.id),
        },
      });

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data[0].type).to.equal(expectedResponse.type);
      expect(response.result.data[0].id).to.equal(expectedResponse.id);
      expect(response.result.data[0].attributes).to.deep.equal(expectedResponse.attributes);
    });
  });
});
