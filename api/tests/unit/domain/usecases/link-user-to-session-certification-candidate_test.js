import { UserAlreadyLinkedToCertificationCandidate } from '../../../../lib/domain/events/UserAlreadyLinkedToCertificationCandidate.js';
import { UserLinkedToCertificationCandidate } from '../../../../lib/domain/events/UserLinkedToCertificationCandidate.js';
import { linkUserToSessionCertificationCandidate } from '../../../../lib/domain/usecases/link-user-to-session-certification-candidate.js';
import {
  CertificationCandidateByPersonalInfoNotFoundError,
  CertificationCandidateByPersonalInfoTooManyMatchesError,
  LanguageNotSupportedError,
  MatchingReconciledStudentNotFoundError,
  UnexpectedUserAccountError,
  UserAlreadyLinkedToCandidateInSessionError,
} from '../../../../src/shared/domain/errors.js';
import { catchErr, domainBuilder, expect, sinon } from '../../../test-helper.js';

describe('Unit | Domain | Use Cases | link-user-to-session-certification-candidate', function () {
  let certificationCandidateData;
  const sessionId = 42;
  const userId = 'userId';
  const firstName = 'Charlie';
  const lastName = 'Bideau';
  const birthdate = '2010-10-10';

  context('when the session is V2 or V3 (common context)', function () {
    const sessionEnrolmentRepository = { get: () => undefined };

    beforeEach(function () {
      sessionEnrolmentRepository.get = sinon.stub();
      sessionEnrolmentRepository.get
        .withArgs({ id: 42 })
        .resolves(domainBuilder.certification.enrolment.buildSession.created());

      certificationCandidateData = {
        userId,
        firstName,
        lastName,
        birthdate,
        subscriptions: [domainBuilder.buildCoreSubscription()],
      };
    });

    context('when there is a problem with the personal info', function () {
      context('when no certification candidates match with the provided personal info', function () {
        it('should throw a CertificationCandidateByPersonalInfoNotFoundError', async function () {
          // given
          const certificationCandidateRepository =
            _buildFakeCertificationCandidateRepository().withFindBySessionIdAndPersonalInfo({
              args: {
                sessionId,
                firstName,
                lastName,
                birthdate,
              },
              resolves: [],
            });

          // when
          const err = await catchErr(linkUserToSessionCertificationCandidate)({
            sessionId,
            userId,
            firstName,
            lastName,
            birthdate,
            sessionEnrolmentRepository,
            certificationCandidateRepository,
          });

          // then
          expect(err).to.be.instanceOf(CertificationCandidateByPersonalInfoNotFoundError);
        });
      });

      context(
        'when there are more than one certification candidates that match with the provided personal info',
        function () {
          it('should throw a CertificationCandidateByPersonalInfoTooManyMatchesError', async function () {
            // given
            const certificationCandidateRepository =
              _buildFakeCertificationCandidateRepository().withFindBySessionIdAndPersonalInfo({
                args: {
                  sessionId,
                  firstName,
                  lastName,
                  birthdate,
                },
                resolves: ['candidate1', 'candidate2'],
              });

            // when
            const err = await catchErr(linkUserToSessionCertificationCandidate)({
              sessionId,
              userId,
              firstName,
              lastName,
              birthdate,
              sessionEnrolmentRepository,
              certificationCandidateRepository,
            });

            // then
            expect(err).to.be.instanceOf(CertificationCandidateByPersonalInfoTooManyMatchesError);
          });
        },
      );
    });

    context(
      'when there is exactly one certification candidate that matches with the provided personal info',
      function () {
        context('when the matching certification candidate is already linked to a user', function () {
          context('when the linked user is the same as the user being linked', function () {
            it('should not create a link and return the matching certification candidate', async function () {
              // given
              const certificationCandidate = domainBuilder.buildCertificationCandidate(certificationCandidateData);
              const certificationCandidateRepository =
                _buildFakeCertificationCandidateRepository().withFindBySessionIdAndPersonalInfo({
                  args: {
                    sessionId,
                    firstName,
                    lastName,
                    birthdate,
                  },
                  resolves: [certificationCandidate],
                });

              const certificationCenter = domainBuilder.buildCertificationCenter({ sessionId, type: 'SUP' });
              const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
                args: { sessionId },
                resolves: certificationCenter,
              });

              // when
              const result = await linkUserToSessionCertificationCandidate({
                sessionId,
                userId,
                firstName,
                lastName,
                birthdate,
                sessionEnrolmentRepository,
                certificationCandidateRepository,
                certificationCenterRepository,
              });

              // then
              expect(result).to.deep.equal(new UserAlreadyLinkedToCertificationCandidate());
            });
          });

          context('when the linked user is not the same as the user being linked', function () {
            it('should throw a CandidateAlreadyLinkedToUserError', async function () {
              // given
              const certificationCandidate = domainBuilder.buildCertificationCandidate({
                ...certificationCandidateData,
                userId: 'otherUserId',
              });
              const certificationCandidateRepository =
                _buildFakeCertificationCandidateRepository().withFindBySessionIdAndPersonalInfo({
                  args: {
                    sessionId,
                    firstName,
                    lastName,
                    birthdate,
                  },
                  resolves: [certificationCandidate],
                });

              const certificationCenter = domainBuilder.buildCertificationCenter({ sessionId, type: 'SUP' });
              const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
                args: { sessionId },
                resolves: certificationCenter,
              });

              // when
              const err = await catchErr(linkUserToSessionCertificationCandidate)({
                sessionId,
                userId,
                firstName,
                lastName,
                birthdate,
                sessionEnrolmentRepository,
                certificationCandidateRepository,
                certificationCenterRepository,
              });

              // then
              expect(err).to.be.instanceOf(UnexpectedUserAccountError);
            });
          });
        });

        context('when the matching certification candidate has no link to any user', function () {
          context('when the user is already linked to another candidate in the session', function () {
            it('should throw a UserAlreadyLinkedToCandidateInSessionError', async function () {
              // given
              const certificationCandidate = domainBuilder.buildCertificationCandidate({
                ...certificationCandidateData,
                userId: null,
              });
              const certificationCandidateRepository = _buildFakeCertificationCandidateRepository()
                .withFindBySessionIdAndPersonalInfo({
                  args: {
                    sessionId,
                    firstName,
                    lastName,
                    birthdate,
                  },
                  resolves: [certificationCandidate],
                })
                .withFindOneBySessionIdAndUserId({
                  args: { sessionId, userId },
                  resolves: 'existingLinkedCandidateToUser',
                });

              const certificationCenter = domainBuilder.buildCertificationCenter({ sessionId, type: 'SUP' });
              const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
                args: { sessionId },
                resolves: certificationCenter,
              });

              // when
              const err = await catchErr(linkUserToSessionCertificationCandidate)({
                sessionId,
                userId,
                firstName,
                lastName,
                birthdate,
                sessionEnrolmentRepository,
                certificationCandidateRepository,
                certificationCenterRepository,
              });

              // then
              expect(err).to.be.instanceOf(UserAlreadyLinkedToCandidateInSessionError);
            });
          });

          context('when the user is not linked to any candidate in this session', function () {
            it('should create a link between the candidate and the user and return the linked certification candidate', async function () {
              // given
              const certificationCandidate = domainBuilder.buildCertificationCandidate({
                ...certificationCandidateData,
                userId: null,
                id: 'candidateId',
              });
              const certificationCandidateRepository = _buildFakeCertificationCandidateRepository()
                .withFindBySessionIdAndPersonalInfo({
                  args: {
                    sessionId,
                    firstName,
                    lastName,
                    birthdate,
                  },
                  resolves: [certificationCandidate],
                })
                .withFindOneBySessionIdAndUserId({ args: { sessionId, userId }, resolves: undefined })
                .withLinkToUser({});

              const certificationCenter = domainBuilder.buildCertificationCenter({ sessionId, type: 'SUP' });
              const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
                args: { sessionId },
                resolves: certificationCenter,
              });

              // when
              const result = await linkUserToSessionCertificationCandidate({
                sessionId,
                userId,
                firstName,
                lastName,
                birthdate,
                sessionEnrolmentRepository,
                certificationCandidateRepository,
                certificationCenterRepository,
              });

              // then
              expect(result).to.deep.equal(new UserAlreadyLinkedToCertificationCandidate());
              sinon.assert.calledWith(certificationCandidateRepository.linkToUser, {
                id: certificationCandidate.id,
                userId,
              });
            });
          });
        });
      },
    );

    context('when the organization behind this session is of type SCO', function () {
      context('when the organization is also managing students', function () {
        context('when the user does not match with a session candidate and its organization learner', function () {
          it('throws MatchingReconciledStudentNotFoundError', async function () {
            // given
            const certificationCandidate = domainBuilder.buildCertificationCandidate({
              ...certificationCandidateData,
              userId: null,
            });
            const certificationCandidateRepository =
              _buildFakeCertificationCandidateRepository().withFindBySessionIdAndPersonalInfo({
                args: {
                  sessionId,
                  firstName,
                  lastName,
                  birthdate,
                },
                resolves: [certificationCandidate],
              });

            const certificationCenter = domainBuilder.buildCertificationCenter({
              sessionId,
              type: 'SCO',
              externalId: '123456',
            });
            const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
              args: { sessionId },
              resolves: certificationCenter,
            });
            const organization = domainBuilder.buildOrganization({
              type: 'SCO',
              isManagingStudents: true,
              externalId: '123456',
            });
            const organizationRepository = _buildFakeOrganizationRepository().withGetScoOrganizationByExternalId({
              args: '123456',
              resolves: organization,
            });

            const organizationLearnerRepository =
              _buildFakeOrganizationLearnerRepository().withIsOrganizationLearnerIdLinkedToUserAndSCOOrganization({
                args: { userId, organizationLearnerId: certificationCandidate.organizationLearnerId },
                resolves: false,
              });

            // when
            const err = await catchErr(linkUserToSessionCertificationCandidate)({
              sessionId,
              userId,
              firstName,
              lastName,
              birthdate,
              sessionEnrolmentRepository,
              certificationCandidateRepository,
              organizationLearnerRepository,
              certificationCenterRepository,
              organizationRepository,
            });

            // then
            expect(err).to.be.instanceOf(MatchingReconciledStudentNotFoundError);
          });
        });

        context('when the user matches with a session candidate and its organization learner', function () {
          context('when no other candidates is already linked to that user', function () {
            it('should create a link between the candidate and the user and return an event to notify it, ', async function () {
              // given
              const organizationLearner = domainBuilder.buildOrganizationLearner();
              const certificationCandidate = domainBuilder.buildCertificationCandidate({
                ...certificationCandidateData,
                userId: null,
                organizationLearnerId: organizationLearner.id,
              });
              const certificationCandidateRepository = _buildFakeCertificationCandidateRepository()
                .withFindBySessionIdAndPersonalInfo({
                  args: {
                    sessionId,
                    firstName,
                    lastName,
                    birthdate,
                  },
                  resolves: [certificationCandidate],
                })
                .withFindOneBySessionIdAndUserId({
                  args: {
                    sessionId,
                    userId,
                  },
                  resolves: null,
                });

              const certificationCenter = domainBuilder.buildCertificationCenter({
                sessionId,
                type: 'SCO',
                externalId: '123456',
              });
              const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
                args: { sessionId },
                resolves: certificationCenter,
              });
              const organization = domainBuilder.buildOrganization({
                type: 'SCO',
                isManagingStudents: true,
                externalId: '123456',
              });
              const organizationRepository = _buildFakeOrganizationRepository().withGetScoOrganizationByExternalId({
                args: '123456',
                resolves: organization,
              });

              const organizationLearnerRepository =
                _buildFakeOrganizationLearnerRepository().withIsOrganizationLearnerIdLinkedToUserAndSCOOrganization({
                  args: { userId, organizationLearnerId: certificationCandidate.organizationLearnerId },
                  resolves: true,
                });

              // when
              const event = await linkUserToSessionCertificationCandidate({
                sessionId,
                userId,
                firstName,
                lastName,
                birthdate,
                sessionEnrolmentRepository,
                certificationCandidateRepository,
                organizationLearnerRepository,
                certificationCenterRepository,
                organizationRepository,
              });

              // then
              expect(certificationCandidateRepository.linkToUser).to.have.been.calledWithExactly({
                id: certificationCandidate.id,
                userId,
              });
              expect(
                organizationLearnerRepository.isOrganizationLearnerIdLinkedToUserAndSCOOrganization,
              ).to.have.been.calledWithExactly({ userId, organizationLearnerId: organizationLearner.id });
              expect(event).to.be.instanceOf(UserLinkedToCertificationCandidate);
            });
          });

          context('when another candidates is already linked to that user', function () {
            it('throws UserAlreadyLinkedToCandidateInSessionError', async function () {
              // given
              const organizationLearner = domainBuilder.buildOrganizationLearner();
              const certificationCandidate = domainBuilder.buildCertificationCandidate({
                ...certificationCandidateData,
                userId: null,
                organizationLearnerId: organizationLearner.id,
              });
              const certificationCandidateRepository = _buildFakeCertificationCandidateRepository()
                .withFindBySessionIdAndPersonalInfo({
                  args: {
                    sessionId,
                    firstName,
                    lastName,
                    birthdate,
                  },
                  resolves: [certificationCandidate],
                })
                .withFindOneBySessionIdAndUserId({
                  args: {
                    sessionId,
                    userId,
                  },
                  resolves: domainBuilder.buildCertificationCandidate({
                    id: 'another candidate',
                    ...certificationCandidateData,
                  }),
                });

              const certificationCenter = domainBuilder.buildCertificationCenter({
                sessionId,
                type: 'SCO',
                externalId: '123456',
              });
              const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
                args: { sessionId },
                resolves: certificationCenter,
              });
              const organization = domainBuilder.buildOrganization({
                type: 'SCO',
                isManagingStudents: true,
                externalId: '123456',
              });
              const organizationRepository = _buildFakeOrganizationRepository().withGetScoOrganizationByExternalId({
                args: '123456',
                resolves: organization,
              });

              const organizationLearnerRepository =
                _buildFakeOrganizationLearnerRepository().withIsOrganizationLearnerIdLinkedToUserAndSCOOrganization({
                  args: { userId, organizationLearnerId: certificationCandidate.organizationLearnerId },
                  resolves: true,
                });

              // when
              const error = await catchErr(linkUserToSessionCertificationCandidate)({
                sessionId,
                userId,
                firstName,
                lastName,
                birthdate,
                sessionEnrolmentRepository,
                certificationCandidateRepository,
                organizationLearnerRepository,
                certificationCenterRepository,
                organizationRepository,
              });

              // then
              expect(
                organizationLearnerRepository.isOrganizationLearnerIdLinkedToUserAndSCOOrganization,
              ).to.have.been.calledWithExactly({ userId, organizationLearnerId: organizationLearner.id });
              expect(error).to.be.an.instanceof(UserAlreadyLinkedToCandidateInSessionError);
            });
          });
        });
      });

      context('when the organization is not managing students', function () {
        it('should return the linked certification candidate', async function () {
          // given
          const certificationCandidate = domainBuilder.buildCertificationCandidate({
            ...certificationCandidateData,
            userId: null,
            id: 'candidateId',
          });
          const certificationCandidateRepository = _buildFakeCertificationCandidateRepository()
            .withFindBySessionIdAndPersonalInfo({
              args: {
                sessionId,
                firstName,
                lastName,
                birthdate,
              },
              resolves: [certificationCandidate],
            })
            .withFindOneBySessionIdAndUserId({ args: { sessionId, userId }, resolves: undefined })
            .withLinkToUser({});

          const certificationCenter = domainBuilder.buildCertificationCenter({
            sessionId,
            type: 'SCO',
            externalId: '123456',
          });
          const certificationCenterRepository = _buildFakeCertificationCenterRepository().withGetBySessionId({
            args: { sessionId },
            resolves: certificationCenter,
          });
          const organization = domainBuilder.buildOrganization({
            type: 'SCO',
            isManagingStudents: false,
            externalId: '123456',
          });
          const organizationRepository = _buildFakeOrganizationRepository().withGetScoOrganizationByExternalId({
            args: '123456',
            resolves: organization,
          });

          const organizationLearnerRepository =
            _buildFakeOrganizationLearnerRepository().withIsOrganizationLearnerIdLinkedToUserAndSCOOrganization({
              args: { userId, organizationLearnerId: certificationCandidate.organizationLearnerId },
              resolves: true,
            });

          // when
          const result = await linkUserToSessionCertificationCandidate({
            sessionId,
            userId,
            firstName,
            lastName,
            birthdate,
            sessionEnrolmentRepository,
            certificationCandidateRepository,
            certificationCenterRepository,
            organizationRepository,
            organizationLearnerRepository,
          });

          // then
          expect(organizationLearnerRepository.isOrganizationLearnerIdLinkedToUserAndSCOOrganization).to.be.not.called;
          expect(result).to.be.an.instanceof(UserLinkedToCertificationCandidate);
        });
      });
    });
  });

  context('when the session is V3', function () {
    context('when the user language is not available', function () {
      it('should throw a language not supported error', async function () {
        const sessionEnrolmentRepository = {
          get: sinon.stub(),
        };
        sessionEnrolmentRepository.get
          .withArgs({ id: 42 })
          .resolves(domainBuilder.certification.enrolment.buildSession({ version: 3 }));
        const userRepository = {
          get: sinon.stub(),
        };
        const userId = '123';
        const user = domainBuilder.buildUser({ id: userId, lang: 'nl' });
        userRepository.get.withArgs(user.id).resolves(user);

        const languageService = {
          isLanguageAvailableForV3Certification: sinon.stub(),
        };
        languageService.isLanguageAvailableForV3Certification.withArgs(user.lang).returns(false);

        // when
        const err = await catchErr(linkUserToSessionCertificationCandidate)({
          sessionId,
          userId,
          firstName,
          lastName,
          birthdate,
          sessionEnrolmentRepository,
          userRepository,
          languageService,
        });

        // then
        expect(err).to.be.instanceOf(LanguageNotSupportedError);
      });
    });
  });
});

function _buildFakeCertificationCenterRepository() {
  const getBySessionId = sinon.stub();
  return {
    getBySessionId,
    withGetBySessionId({ args, resolves }) {
      this.getBySessionId.withArgs(args).resolves(resolves);
      return this;
    },
  };
}

function _buildFakeOrganizationRepository() {
  const getScoOrganizationByExternalId = sinon.stub();
  return {
    getScoOrganizationByExternalId,
    withGetScoOrganizationByExternalId({ args, resolves }) {
      this.getScoOrganizationByExternalId.withArgs(args).resolves(resolves);
      return this;
    },
  };
}

function _buildFakeOrganizationLearnerRepository() {
  const isOrganizationLearnerIdLinkedToUserAndSCOOrganization = sinon.stub();
  return {
    isOrganizationLearnerIdLinkedToUserAndSCOOrganization,
    withIsOrganizationLearnerIdLinkedToUserAndSCOOrganization({ args, resolves }) {
      this.isOrganizationLearnerIdLinkedToUserAndSCOOrganization.withArgs(args).resolves(resolves);
      return this;
    },
  };
}

function _buildFakeCertificationCandidateRepository() {
  const findBySessionIdAndPersonalInfo = sinon.stub();
  const findOneBySessionIdAndUserId = sinon.stub();
  const linkToUser = sinon.stub();
  return {
    findBySessionIdAndPersonalInfo,
    findOneBySessionIdAndUserId,
    linkToUser,
    withFindBySessionIdAndPersonalInfo({ args, resolves }) {
      this.findBySessionIdAndPersonalInfo.withArgs(args).resolves(resolves);
      return this;
    },
    withFindOneBySessionIdAndUserId({ args, resolves }) {
      this.findOneBySessionIdAndUserId.withArgs(args).resolves(resolves);
      return this;
    },
    withLinkToUser({ args, resolves }) {
      this.linkToUser.withArgs(args).resolves(resolves);
      return this;
    },
  };
}
