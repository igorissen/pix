import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { settled } from '@ember/test-helpers';
import EmberObject from '@ember/object';
import { A } from '@ember/array';
import Service from '@ember/service';

function buildCertification(id, status) {
  return EmberObject.create({
    id,
    sessionId: 5,
    certificationId: id,
    assessmentId: 5,
    firstName: 'Toto',
    lastName: 'Le héros',
    birthdate: '20/03/1986',
    birthplace: 'une ville',
    externalId: '1234',
    creationDate: '20/07/2018 14:23:56',
    completionDate: '20/07/2018 14:23:56',
    resultsCreationDate: '20/07/2018 14:23:56',
    status,
    juryId: '',
    commentForCandidate: 'candidate',
    commentForOrganization: 'organization',
    commentForJury: 'jury',
    pixScore: 100,
    indexedCompetences: {
      '1.1': { level: 1, score: 2 },
      '5.4': { level: 5, score: 4 },
      '4.3': { level: -1, score: 0 }
    }
  });
}

function buildCandidate(id, certificationId, comments = null, lastScreen = 'X') {
  return EmberObject.create({
    id,
    certificationId,
    firstName: 'Toto',
    lastName: 'Le héros',
    birthdate: '20/03/1986',
    birthplace: 'une ville',
    externalId: '1234',
    comments,
    lastScreen
  });
}

module('Unit | Controller | authenticated/certifications/sessions/info/list', function(hooks) {
  setupTest(hooks);

  test('it generates well formatted result file', async function(assert) {
    // given
    const fileSaverStub = Service.extend({
      content: '',
      saveAs(content) {
        this.set('content', content);
      },
      getContent() {
        return this.content;
      }
    });
    this.owner.register('service:file-saver', fileSaverStub);
    const controller = this.owner.lookup('controller:authenticated/certifications/sessions/info/list');
    controller.set('model', EmberObject.create({
      certifications: A([
        EmberObject.create({ id: 1 }),
        EmberObject.create({ id: 2 }),
        EmberObject.create({ id: 3 }),
        EmberObject.create({ id: 4 }),
        EmberObject.create({ id: 5 }),
      ])
    }));
    this.set('counter', 0);
    const that = this;
    controller.set('store', {
      findRecord(type, id) {
        that.set('counter', that.get('counter') + 1);
        return Promise.resolve(EmberObject.create({
          id: id,
          sessionId: 5,
          certificationId: id,
          assessmentId: 5,
          firstName: 'Toto',
          lastName: 'Le héros',
          birthdate: '20/03/1986',
          birthplace: 'une ville',
          externalId: '1234',
          creationDate: '20/07/2018 14:23:56',
          completionDate: '20/07/2018 14:23:56',
          resultsCreationDate: '20/07/2018 14:23:56',
          status: 'completed',
          juryId: '',
          commentForCandidate: 'candidate',
          commentForOrganization: 'organization',
          commentForJury: 'jury',
          pixScore: 100,
          indexedCompetences: {
            '1.1': { level: 1, score: 2 },
            '5.4': { level: 5, score: 4 },
            '4.3': { level: -1, score: 0 }
          }
        }));
      }
    });
    assert.expect(2);

    // when
    await controller.send('downloadResultsAfterJurysDeliberation');

    // then
    return settled()
      .then(() => {
        assert.equal(this.get('counter'), 5);
        const service = this.owner.lookup('service:file-saver');
        assert.equal(service.getContent(), '"Numéro de certification";"Prénom";"Nom";"Date de naissance";"Lieu de naissance";"Identifiant Externe";"Nombre de Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2";"Session";"Centre de certification";"Date de passage de la certification"\n1;"Toto";"Le héros";"20/03/1986";"une ville";"1234";100;1;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";5;;"20/07/2018"\n2;"Toto";"Le héros";"20/03/1986";"une ville";"1234";100;1;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";5;;"20/07/2018"\n3;"Toto";"Le héros";"20/03/1986";"une ville";"1234";100;1;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";5;;"20/07/2018"\n4;"Toto";"Le héros";"20/03/1986";"une ville";"1234";100;1;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";5;;"20/07/2018"\n5;"Toto";"Le héros";"20/03/1986";"une ville";"1234";100;1;"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";"-";5;;"20/07/2018"\n');
      });

  });

  module('#downloadGetJuryFile', function(hooks) {

    let fileSaverStub;
    let controller;

    hooks.beforeEach(function() {
      const FileSaverStub = Service.extend({
        content: '',
        saveAs(content) {
          this.set('content', content);
        },
        getContent() {
          return this.content;
        }
      });
      this.owner.register('service:file-saver', FileSaverStub);
      fileSaverStub = this.owner.lookup('service:file-saver');

      controller = this.owner.lookup('controller:authenticated/certifications/sessions/info/list');
    });

    test('should include certification which status is not "validated"', async function(assert) {
      const session = EmberObject.create({
        id: 5,
        certifications: A([
          buildCertification('1', 'validated'),
          buildCertification('2', 'started'),
          buildCertification('3', 'rejected'),
          buildCertification('4', 'error'),
        ])
      });
      controller.set('model', session);

      const validSessionCandidates = [
        buildCandidate(1, '1'),
        buildCandidate(2, '2'),
        buildCandidate(3, '3'),
        buildCandidate(4, '4'),
      ];

      // when
      controller.send('downloadGetJuryFile', validSessionCandidates);

      // then
      assert.equal(fileSaverStub.getContent(), '\uFEFF' +
        '"ID de session";"ID de certification";"Statut de la certification";"Date de debut";"Date de fin";"Commentaire surveillant";"Commentaire pour le jury";"Note Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2"\n' +
        '5;"2";"started";"20/07/2018 14:23:56";"20/07/2018 14:23:56";;"jury";100;1;"";"";"";"";"";"";"";"";"";"";"";"";-1;"";""\n' +
        '5;"3";"rejected";"20/07/2018 14:23:56";"20/07/2018 14:23:56";;"jury";100;1;"";"";"";"";"";"";"";"";"";"";"";"";-1;"";""\n' +
        '5;"4";"error";"20/07/2018 14:23:56";"20/07/2018 14:23:56";;"jury";100;1;"";"";"";"";"";"";"";"";"";"";"";"";-1;"";""\n');
    });

    test('should include certification which corresponding candidate has comments from manager', async function(assert) {
      const session = EmberObject.create({
        id: 5,
        certifications: A([
          buildCertification('1', 'validated'),
          buildCertification('2', 'validated'),
          buildCertification('3', 'validated'),
        ])
      });
      controller.set('model', session);

      const candidateWithoutComments = buildCandidate(1, '1', null);
      const candidateWithEmptyComments = buildCandidate(1, '1', '   ');
      const candidateWithComments = buildCandidate(2, '2', 'manager comments');

      // when
      controller.send('downloadGetJuryFile', [candidateWithoutComments, candidateWithEmptyComments, candidateWithComments]);

      // then
      assert.equal(fileSaverStub.getContent(), '\uFEFF' +
        '"ID de session";"ID de certification";"Statut de la certification";"Date de debut";"Date de fin";"Commentaire surveillant";"Commentaire pour le jury";"Note Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2"\n' +
        '5;"2";"validated";"20/07/2018 14:23:56";"20/07/2018 14:23:56";"manager comments";"jury";100;1;"";"";"";"";"";"";"";"";"";"";"";"";-1;"";""\n');
    });

    test('should include certification which corresponding candidate did not seen the end screen', async function(assert) {
      const session = EmberObject.create({
        id: 5,
        certifications: A([
          buildCertification('1', 'validated'),
          buildCertification('2', 'validated'),
          buildCertification('3', 'validated'),
        ])
      });
      controller.set('model', session);

      const candidateThatSawTheEndScreen = buildCandidate(1, '1', null, '  X  ');
      const candidateThatDidNotSeenTheEndScreen_null = buildCandidate(2, '2', null, null);
      const candidateThatDidNotSeenTheEndScreen_emptyString = buildCandidate(3, '3', null, '    ');

      // when
      controller.send('downloadGetJuryFile', [candidateThatSawTheEndScreen, candidateThatDidNotSeenTheEndScreen_null, candidateThatDidNotSeenTheEndScreen_emptyString]);

      // then
      assert.equal(fileSaverStub.getContent(), '\uFEFF' +
        '"ID de session";"ID de certification";"Statut de la certification";"Date de debut";"Date de fin";"Commentaire surveillant";"Commentaire pour le jury";"Note Pix";"1.1";"1.2";"1.3";"2.1";"2.2";"2.3";"2.4";"3.1";"3.2";"3.3";"3.4";"4.1";"4.2";"4.3";"5.1";"5.2"\n' +
        '5;"2";"validated";"20/07/2018 14:23:56";"20/07/2018 14:23:56";;"jury";100;1;"";"";"";"";"";"";"";"";"";"";"";"";-1;"";""\n' +
        '5;"3";"validated";"20/07/2018 14:23:56";"20/07/2018 14:23:56";;"jury";100;1;"";"";"";"";"";"";"";"";"";"";"";"";-1;"";""\n');
    });
  });
});
