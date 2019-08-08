const { expect, generateValidRequestAuhorizationHeader, nock, databaseBuilder } = require('../../../test-helper');
const createServer = require('../../../../server');
const cache = require('../../../../lib/infrastructure/caches/cache');

describe('Acceptance | Controller | answer-controller-get-correction', () => {

  let server;

  beforeEach(async () => {
    server = await createServer();
  });

  describe('GET /api/answers/{id}/correction', function() {

    let assessment = null;
    let answer = null;
    const userId = 123;

    before(() => {
      nock('https://api.airtable.com')
        .get('/v0/test-base/Epreuves/q_first_challenge')
        .query(true)
        .times(2)
        .reply(200, {
          'id': 'q_first_challenge',
          'fields': {
            'Statut': 'validé',
            'competences': ['competence_id'],
            'acquis': ['@web3'],
            'Bonnes réponses': 'fromage',
            'Acquix': ['q_first_acquis']
          }
        });
      nock('https://api.airtable.com')
        .get('/v0/test-base/Acquis/q_first_acquis')
        .query(true)
        .times(2)
        .reply(200, {
          'id': 'q_first_acquis',
          'fields': {
            'Nom': '@web3',
            'Indice': 'Indice web3',
            'Statut de l\'indice': 'Validé',
            'Compétence (via Tube)': 'recABCD'
          }
        });
    });

    after(() => {
      nock.cleanAll();
      cache.flushAll();
    });

    beforeEach(async () => {
      assessment = databaseBuilder.factory.buildAssessment({
        courseId: 'adaptive_course_id',
        state: 'completed',
        userId
      });

      answer = databaseBuilder.factory.buildAnswer({
        value: 'any good answer',
        result: 'ok',
        challengeId: 'q_first_challenge',
        assessmentId: assessment.id
      });

      await databaseBuilder.commit();
    });

    afterEach(async() => {
      await databaseBuilder.clean();
    });

    it('should return the answer correction', async () => {
      // given
      const options = {
        method: 'GET',
        url: `/api/answers/${answer.id}/correction`,
        headers: { authorization: generateValidRequestAuhorizationHeader(userId) },
      };

      const expectedBody = {
        data: {
          id: 'q_first_challenge',
          type: 'corrections',
          attributes: {
            solution: 'fromage',
            hint: 'Indice web3',
          },
          relationships: {
            tutorials: {
              'data': [],
            },
            'learning-more-tutorials': {
              'data': [],
            }
          },
        }
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result).to.deep.equal(expectedBody);
    });

    it('should return 403 when user does not has access to this answer', async () => {
      // given
      const options = {
        method: 'GET',
        url: `/api/answers/${answer.id}/correction`,
        headers: { authorization: generateValidRequestAuhorizationHeader(userId + 3) },
      };

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(403);
    });
  });
});
