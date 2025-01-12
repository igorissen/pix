import _ from 'lodash';

import { SessionEnrolment } from '../../../../../../src/certification/enrolment/domain/models/SessionEnrolment.js';
import { domainBuilder, expect, sinon } from '../../../../../test-helper.js';

const SESSION_PROPS = [
  'id',
  'accessCode',
  'address',
  'certificationCenter',
  'date',
  'description',
  'examiner',
  'room',
  'time',
  'certificationCandidates',
  'certificationCenterId',
  'supervisorPassword',
  'version',
  'createdBy',
  'canEnrolCandidate',
];

describe('Unit | Certification | Enrolment | Domain | Models | SessionEnrolment', function () {
  let session;

  beforeEach(function () {
    session = new SessionEnrolment({
      id: 'id',
      accessCode: '',
      address: '',
      certificationCenter: '',
      date: '',
      description: '',
      examiner: '',
      room: '',
      time: '',
      // includes
      certificationCandidates: [],
      // references
      certificationCenterId: '',
      createdBy: '',
      finalizedAt: null,
    });
  });

  it('should create an object of the SessionEnrolment type', function () {
    expect(session).to.be.instanceOf(SessionEnrolment);
  });

  it('should create a session with all the requires properties', function () {
    expect(_.keys(session)).to.have.deep.members(SESSION_PROPS);
  });

  context('#canEnrolCandidate', function () {
    it('should return true when session is not finalized', function () {
      // given
      const session = domainBuilder.certification.enrolment.buildSession.created();

      // when
      const result = session.canEnrolCandidate;

      // then
      expect(result).to.be.true;
    });

    it('should return false when session is not finalized', function () {
      // given
      const session = domainBuilder.certification.enrolment.buildSession.finalized();

      // when
      const result = session.canEnrolCandidate;

      // then
      expect(result).to.be.false;
    });
  });

  context('static #generateSupervisorPassword', function () {
    it('should return a supervisor password containing 5 digits/letters except 0, 1 and vowels', async function () {
      // given
      // when
      const supervisorPassword = SessionEnrolment.generateSupervisorPassword();

      // then
      expect(supervisorPassword).to.match(/^[2346789BCDFGHJKMPQRTVWXY]{5}$/);
    });
  });

  context('#isSessionScheduledInThePast', function () {
    let clock;
    beforeEach(function () {
      clock = sinon.useFakeTimers({
        now: new Date('2023-01-01'),
        toFake: ['Date'],
      });
    });

    afterEach(async function () {
      clock.restore();
    });

    context('when session is scheduled in the past', function () {
      it('should return true', async function () {
        // given
        const session = domainBuilder.certification.enrolment.buildSession({ date: '2022-01-01' });

        // when
        const isSessionScheduledInThePast = session.isSessionScheduledInThePast();

        // then
        expect(isSessionScheduledInThePast).to.be.true;
      });
    });

    context('when session is not scheduled in the past', function () {
      it('should return false', async function () {
        // given
        const session = domainBuilder.certification.enrolment.buildSession({ date: '2024-01-01' });

        // when
        const isSessionScheduledInThePast = session.isSessionScheduledInThePast();

        // then
        expect(isSessionScheduledInThePast).to.be.false;
      });
    });
  });

  context('#isCandidateAlreadyEnrolled', function () {
    it('should return true when all personal info matches (case / diacritics insensitive) with an already enrolled candidate', function () {
      // given
      const candidatePersonalInfo = {
        firstName: 'Frédéric',
        lastName: 'De bussy',
        birthdate: '1990-01-04',
      };
      const session = domainBuilder.certification.enrolment.buildSession();
      const candidates = [
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: 'Un',
          lastName: 'Related',
          birthdate: '1995-04-04',
        }),
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: 'un prénom très proche de frederic',
          lastName: `un nom tres proche de debussy`,
          birthdate: '1990-01-04',
        }),
      ];
      const normalizeStringFnc = sinon.stub();
      normalizeStringFnc.withArgs(candidatePersonalInfo.lastName).returns(candidatePersonalInfo.lastName);
      normalizeStringFnc.withArgs(candidatePersonalInfo.firstName).returns(candidatePersonalInfo.firstName);
      normalizeStringFnc.withArgs(candidates[0].lastName).returns(candidates[0].lastName);
      normalizeStringFnc.withArgs(candidates[0].firstName).returns(candidates[0].firstName);
      normalizeStringFnc.withArgs(candidates[1].lastName).returns(candidatePersonalInfo.lastName);
      normalizeStringFnc.withArgs(candidates[1].firstName).returns(candidatePersonalInfo.firstName);

      // when
      const isCandidateEnrolled = session.isCandidateAlreadyEnrolled({
        candidates,
        candidatePersonalInfo,
        normalizeStringFnc,
      });

      // then
      expect(isCandidateEnrolled).to.be.true;
    });

    it('should return false when first name is not matching an already enrolled candidate', function () {
      // given
      const candidatePersonalInfo = {
        firstName: 'Frédéric',
        lastName: 'De bussy',
        birthdate: '1990-01-04',
      };
      const session = domainBuilder.certification.enrolment.buildSession();
      const candidates = [
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: 'Un',
          lastName: 'Related',
          birthdate: '1995-04-04',
        }),
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: 'Richard',
          lastName: candidatePersonalInfo.lastName,
          birthdate: candidatePersonalInfo.birthdate,
        }),
      ];
      const normalizeStringFnc = sinon.stub((str) => str);

      // when
      const isCandidateEnrolled = session.isCandidateAlreadyEnrolled({
        candidates,
        candidatePersonalInfo,
        normalizeStringFnc,
      });

      // then
      expect(isCandidateEnrolled).to.be.false;
    });

    it('should return false when last name is not matching an already enrolled candidate', function () {
      // given
      const candidatePersonalInfo = {
        firstName: 'Frédéric',
        lastName: 'De bussy',
        birthdate: '1990-01-04',
      };
      const session = domainBuilder.certification.enrolment.buildSession();
      const candidates = [
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: 'Un',
          lastName: 'Related',
          birthdate: '1995-04-04',
        }),
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: candidatePersonalInfo.firstName,
          lastName: 'Chopin',
          birthdate: candidatePersonalInfo.birthdate,
        }),
      ];
      const normalizeStringFnc = sinon.stub((str) => str);

      // when
      const isCandidateEnrolled = session.isCandidateAlreadyEnrolled({
        candidates,
        candidatePersonalInfo,
        normalizeStringFnc,
      });

      // then
      expect(isCandidateEnrolled).to.be.false;
    });

    it('should return false when birthdate is not matching an already enrolled candidate', function () {
      // given
      const candidatePersonalInfo = {
        firstName: 'Frédéric',
        lastName: 'De bussy',
        birthdate: '1990-01-04',
      };
      const session = domainBuilder.certification.enrolment.buildSession();
      const candidates = [
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: 'Un',
          lastName: 'Related',
          birthdate: '1995-04-04',
        }),
        domainBuilder.certification.enrolment.buildCandidate({
          firstName: candidatePersonalInfo.firstName,
          lastName: candidatePersonalInfo.lastName,
          birthdate: '1990-01-05',
        }),
      ];
      const normalizeStringFnc = sinon.stub((str) => str);

      // when
      const isCandidateEnrolled = session.isCandidateAlreadyEnrolled({
        candidates,
        candidatePersonalInfo,
        normalizeStringFnc,
      });

      // then
      expect(isCandidateEnrolled).to.be.false;
    });
  });

  context('#hasLinkedCandidate', function () {
    it('should return true when at least one candidate is linked', function () {
      // given
      const session = domainBuilder.certification.enrolment.buildSession();
      const candidates = [
        domainBuilder.certification.enrolment.buildCandidate({
          userId: null,
        }),
        domainBuilder.certification.enrolment.buildCandidate({
          userId: 123,
        }),
      ];

      // when
      const hasLinkedCandidate = session.hasLinkedCandidate({
        candidates,
      });

      // then
      expect(hasLinkedCandidate).to.be.true;
    });

    it('should return false when no candidate is linked', function () {
      // given
      const session = domainBuilder.certification.enrolment.buildSession();
      const candidates = [
        domainBuilder.certification.enrolment.buildCandidate({
          userId: null,
        }),
        domainBuilder.certification.enrolment.buildCandidate({
          userId: null,
        }),
      ];

      // when
      const hasLinkedCandidate = session.hasLinkedCandidate({
        candidates,
      });

      // then
      expect(hasLinkedCandidate).to.be.false;
    });
  });
});
