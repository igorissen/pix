import { catchErr, domainBuilder, expect, sinon } from '../../../test-helper.js';
import { _forTestOnly } from '../../../../lib/domain/events/index.js';
import { AssessmentResult, status } from '../../../../src/shared/domain/models/AssessmentResult.js';
import { CertificationComputeError } from '../../../../lib/domain/errors.js';
import { AssessmentCompleted } from '../../../../lib/domain/events/AssessmentCompleted.js';
import { ABORT_REASONS, CertificationCourse } from '../../../../lib/domain/models/CertificationCourse.js';
import { CertificationScoringCompleted } from '../../../../lib/domain/events/CertificationScoringCompleted.js';
import { config } from '../../../../src/shared/config.js';
import {
  generateAnswersForChallenges,
  generateChallengeList,
} from '../../../certification/shared/fixtures/challenges.js';
import { CertificationChallengeForScoring } from '../../../../src/certification/scoring/domain/models/CertificationChallengeForScoring.js';
import { AssessmentResultFactory } from '../../../../src/certification/scoring/domain/models/factories/AssessmentResultFactory.js';

const { handleCertificationScoring } = _forTestOnly.handlers;

const { minimumAnswersRequiredToValidateACertification } = config.v3Certification.scoring;

const maximumAssessmentLength = 32;

describe('Unit | Domain | Events | handle-certification-scoring', function () {
  let scoringCertificationService;
  let certificationAssessmentRepository;
  let assessmentResultRepository;
  let certificationCourseRepository;
  let competenceForScoringRepository;
  let competenceMarkRepository;
  let answerRepository;
  let flashAlgorithmConfigurationRepository;
  let flashAlgorithmService;
  let baseFlashAlgorithmConfiguration;
  let certificationChallengeForScoringRepository;

  const now = new Date('2019-01-01T05:06:07Z');
  let clock;

  beforeEach(function () {
    clock = sinon.useFakeTimers({ now, toFake: ['Date'] });

    scoringCertificationService = { calculateCertificationAssessmentScore: sinon.stub() };
    certificationAssessmentRepository = { get: sinon.stub() };
    assessmentResultRepository = { save: sinon.stub() };
    certificationCourseRepository = {
      get: sinon.stub(),
      update: sinon.stub(),
      getCreationDate: sinon.stub(),
    };
    competenceForScoringRepository = { listByLocale: sinon.stub() };
    competenceMarkRepository = { save: sinon.stub() };
    certificationChallengeForScoringRepository = { getByCertificationCourseId: sinon.stub() };
    answerRepository = { findByAssessment: sinon.stub() };
    flashAlgorithmConfigurationRepository = { get: sinon.stub() };
    baseFlashAlgorithmConfiguration = domainBuilder.buildFlashAlgorithmConfiguration({
      maximumAssessmentLength,
    });
  });

  afterEach(function () {
    clock.restore();
  });

  context('when assessment is of type CERTIFICATION', function () {
    const assessmentId = 1214;
    const certificationCourseId = 1234;
    const userId = 4567;
    let event;
    let certificationAssessment;

    it('fails when event is not of correct type', async function () {
      // given
      const event = 'not an event of the correct type';
      // when / then
      const error = await catchErr(handleCertificationScoring)({
        event,
        assessmentResultRepository,
        certificationCourseRepository,
        competenceMarkRepository,
        scoringCertificationService,
        certificationAssessmentRepository,
      });

      // then
      expect(error).not.to.be.null;
    });

    context('when certification is V2', function () {
      beforeEach(function () {
        event = new AssessmentCompleted({
          assessmentId,
          userId,
          certificationCourseId: 123,
        });
        certificationAssessment = {
          id: assessmentId,
          certificationCourseId,
          userId,
          createdAt: Symbol('someCreationDate'),
        };
        certificationAssessmentRepository.get.withArgs(assessmentId).resolves(certificationAssessment);
      });

      context('when an error different from a compute error happens', function () {
        const otherError = new Error();
        beforeEach(function () {
          scoringCertificationService.calculateCertificationAssessmentScore.rejects(otherError);
          sinon.stub(AssessmentResultFactory, 'buildAlgoErrorResult');
        });

        it('should not save any results', async function () {
          // when
          await catchErr(handleCertificationScoring)({
            event,
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            scoringCertificationService,
            certificationAssessmentRepository,
          });

          // then
          expect(AssessmentResultFactory.buildAlgoErrorResult).to.not.have.been.called;
          expect(assessmentResultRepository.save).to.not.have.been.called;
          expect(certificationCourseRepository.update).to.not.have.been.called;
        });
      });

      context('when an error of type CertificationComputeError happens while scoring the assessment', function () {
        const computeError = new CertificationComputeError();
        let errorAssessmentResult;
        let certificationCourse;

        beforeEach(function () {
          errorAssessmentResult = domainBuilder.buildAssessmentResult({ id: 98 });
          certificationCourse = domainBuilder.buildCertificationCourse({
            id: certificationCourseId,
            completedAt: null,
          });

          scoringCertificationService.calculateCertificationAssessmentScore.rejects(computeError);
          sinon.stub(AssessmentResultFactory, 'buildAlgoErrorResult').returns(errorAssessmentResult);
          assessmentResultRepository.save.resolves(errorAssessmentResult);
          certificationCourseRepository.get
            .withArgs(certificationAssessment.certificationCourseId)
            .resolves(certificationCourse);
          certificationCourseRepository.update.resolves(certificationCourse);
        });

        it('should call the scoring service with the right arguments', async function () {
          // when
          await handleCertificationScoring({
            event,
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            scoringCertificationService,
            certificationAssessmentRepository,
          });

          // then
          expect(scoringCertificationService.calculateCertificationAssessmentScore).to.have.been.calledWithExactly({
            certificationAssessment,
            continueOnError: false,
          });
        });

        it('should save the error result appropriately', async function () {
          // when
          await handleCertificationScoring({
            event,
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            scoringCertificationService,
            certificationAssessmentRepository,
          });

          // then
          expect(AssessmentResultFactory.buildAlgoErrorResult).to.have.been.calledWithExactly({
            error: computeError,
            assessmentId: certificationAssessment.id,
            emitter: 'PIX-ALGO',
          });
          expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
            certificationCourseId: 1234,
            assessmentResult: errorAssessmentResult,
          });
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
            new CertificationCourse({
              ...certificationCourse.toDTO(),
              completedAt: now,
            }),
          );
        });
      });

      context('when scoring is successful', function () {
        const assessmentResultId = 99;
        let certificationCourse;
        let competenceMark1;
        let competenceMark2;
        let savedAssessmentResult;
        let expectedAssessmentResult;
        let certificationAssessmentScore;

        beforeEach(function () {
          certificationCourse = domainBuilder.buildCertificationCourse({
            id: certificationCourseId,
            completedAt: null,
          });
          competenceMark1 = domainBuilder.buildCompetenceMark({ assessmentResultId, score: 5 });
          competenceMark2 = domainBuilder.buildCompetenceMark({ assessmentResultId, score: 4 });
          savedAssessmentResult = { id: assessmentResultId };
          certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScore({
            nbPix: 9,
            status: status.VALIDATED,
            competenceMarks: [competenceMark1, competenceMark2],
            percentageCorrectAnswers: 80,
          });

          assessmentResultRepository.save.resolves(savedAssessmentResult);
          competenceMarkRepository.save.resolves();
          scoringCertificationService.calculateCertificationAssessmentScore.resolves(certificationAssessmentScore);
          certificationCourseRepository.get
            .withArgs(certificationAssessment.certificationCourseId)
            .resolves(certificationCourse);
          certificationCourseRepository.update.resolves(certificationCourse);
        });

        it('should build and save an assessment result with the expected arguments', async function () {
          // when
          await handleCertificationScoring({
            event,
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            scoringCertificationService,
            certificationAssessmentRepository,
          });

          // then
          expectedAssessmentResult = new AssessmentResult({
            pixScore: certificationAssessmentScore.nbPix,
            reproducibilityRate: certificationAssessmentScore.percentageCorrectAnswers,
            status: certificationAssessmentScore.status,
            assessmentId: certificationAssessment.id,
            emitter: 'PIX-ALGO',
          });

          expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
            certificationCourseId: 1234,
            assessmentResult: expectedAssessmentResult,
          });
          expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
            new CertificationCourse({
              ...certificationCourse.toDTO(),
              completedAt: now,
            }),
          );
        });

        it('should return a CertificationScoringCompleted', async function () {
          // when
          const certificationScoringCompleted = await handleCertificationScoring({
            event,
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            scoringCertificationService,
            certificationAssessmentRepository,
          });

          // then
          expect(certificationScoringCompleted).to.be.instanceof(CertificationScoringCompleted);
          expect(certificationScoringCompleted).to.deep.equal({
            userId: event.userId,
            certificationCourseId: certificationAssessment.certificationCourseId,
            reproducibilityRate: certificationAssessmentScore.percentageCorrectAnswers,
          });
        });

        it('should build and save as many competence marks as present in the certificationAssessmentScore', async function () {
          // when
          await handleCertificationScoring({
            event,
            assessmentResultRepository,
            certificationCourseRepository,
            competenceMarkRepository,
            scoringCertificationService,
            certificationAssessmentRepository,
          });

          // then
          expect(competenceMarkRepository.save.callCount).to.equal(certificationAssessmentScore.competenceMarks.length);
        });
      });
    });

    context('when certification is V3', function () {
      let certificationCourse;
      const assessmentResultId = 99;
      beforeEach(function () {
        event = new AssessmentCompleted({
          assessmentId,
          userId,
          certificationCourseId: 123,
        });
        certificationAssessment = {
          id: assessmentId,
          certificationCourseId,
          userId,
          createdAt: Symbol('someCreationDate'),
          version: 3,
        };
        certificationAssessmentRepository.get.withArgs(assessmentId).resolves(certificationAssessment);
        certificationCourse = domainBuilder.buildCertificationCourse({
          id: certificationCourseId,
          completedAt: null,
        });

        flashAlgorithmService = {
          getEstimatedLevelAndErrorRate: sinon.stub(),
        };

        competenceForScoringRepository.listByLocale.resolves([domainBuilder.buildCompetenceForScoring()]);
        assessmentResultRepository.save.resolves(
          domainBuilder.buildAssessmentResult({
            id: assessmentResultId,
          }),
        );
      });

      describe('when less than the minimum number of answers required by the config has been answered and the candidate abandoned', function () {
        describe('when the candidate did not finish due to a lack of time', function () {
          it('should reject the certification', async function () {
            // given
            const expectedEstimatedLevel = 2;
            const scoreForEstimatedLevel = 592;
            const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
              id: certificationCourseId,
              abortReason: ABORT_REASONS.CANDIDATE,
            });

            const challenges = _generateCertificationChallengeForScoringList({
              length: minimumAnswersRequiredToValidateACertification - 1,
            });

            const answers = generateAnswersForChallenges({ challenges });

            flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);

            certificationChallengeForScoringRepository.getByCertificationCourseId
              .withArgs({ certificationCourseId })
              .resolves(challenges);
            answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
            certificationCourseRepository.get.withArgs(certificationCourseId).resolves(abortedCertificationCourse);

            flashAlgorithmService.getEstimatedLevelAndErrorRate
              .withArgs({
                challenges,
                allAnswers: answers,
                estimatedLevel: sinon.match.number,
                variationPercent: undefined,
                variationPercentUntil: undefined,
                doubleMeasuresUntil: undefined,
              })
              .returns({
                estimatedLevel: expectedEstimatedLevel,
              });

            // when
            await handleCertificationScoring({
              event,
              certificationChallengeForScoringRepository,
              answerRepository,
              assessmentResultRepository,
              certificationCourseRepository,
              competenceForScoringRepository,
              competenceMarkRepository,
              scoringCertificationService,
              certificationAssessmentRepository,
              flashAlgorithmConfigurationRepository,
              flashAlgorithmService,
            });

            // then
            const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScoreV3({
              nbPix: scoreForEstimatedLevel,
              status: status.REJECTED,
            });
            const expectedAssessmentResult = new AssessmentResult({
              pixScore: scoreForEstimatedLevel,
              reproducibilityRate: certificationAssessmentScore.getPercentageCorrectAnswers(),
              status: status.REJECTED,
              assessmentId: certificationAssessment.id,
              emitter: 'PIX-ALGO',
            });

            expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
              certificationCourseId: 1234,
              assessmentResult: expectedAssessmentResult,
            });
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
              new CertificationCourse({
                ...certificationCourse.toDTO(),
                completedAt: now,
                abortReason: 'candidate',
              }),
            );
          });
        });

        describe('when the candidate did not finish due to technical difficulties', function () {
          it('should cancel the certification and reject the assessment result', async function () {
            // given
            const abortReason = ABORT_REASONS.TECHNICAL;
            const expectedEstimatedLevel = 2;
            const scoreForEstimatedLevel = 592;
            const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
              id: certificationCourseId,
              completedAt: null,
              abortReason,
            });

            const challenges = _generateCertificationChallengeForScoringList({
              length: minimumAnswersRequiredToValidateACertification - 1,
            });

            const answers = generateAnswersForChallenges({ challenges });

            flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);

            certificationChallengeForScoringRepository.getByCertificationCourseId
              .withArgs({ certificationCourseId })
              .resolves(challenges);

            answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
            certificationCourseRepository.get.withArgs(certificationCourseId).resolves(abortedCertificationCourse);

            flashAlgorithmService.getEstimatedLevelAndErrorRate
              .withArgs({
                challenges,
                allAnswers: answers,
                estimatedLevel: sinon.match.number,
                variationPercent: undefined,
                variationPercentUntil: undefined,
                doubleMeasuresUntil: undefined,
              })
              .returns({
                estimatedLevel: expectedEstimatedLevel,
              });

            // when
            await handleCertificationScoring({
              event,
              certificationChallengeForScoringRepository,
              answerRepository,
              assessmentResultRepository,
              certificationCourseRepository,
              competenceForScoringRepository,
              competenceMarkRepository,
              scoringCertificationService,
              certificationAssessmentRepository,
              flashAlgorithmConfigurationRepository,
              flashAlgorithmService,
            });

            // then
            const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScoreV3({
              nbPix: scoreForEstimatedLevel,
              status: status.REJECTED,
            });
            const expectedAssessmentResult = new AssessmentResult({
              pixScore: scoreForEstimatedLevel,
              reproducibilityRate: certificationAssessmentScore.getPercentageCorrectAnswers(),
              status: status.REJECTED,
              assessmentId: certificationAssessment.id,
              emitter: 'PIX-ALGO',
            });

            expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
              certificationCourseId: 1234,
              assessmentResult: expectedAssessmentResult,
            });

            expect(certificationCourseRepository.update.firstCall.args[0]).to.deep.equal(
              new CertificationCourse({
                ...certificationCourse.toDTO(),
                isCancelled: true,
                abortReason,
              }),
            );

            expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
              new CertificationCourse({
                ...certificationCourse.toDTO(),
                isCancelled: true,
                abortReason,
              }),
            );
          });
        });
      });

      describe('when at least the minimum number of answers required by the config has been answered', function () {
        describe('when the certification was completed', function () {
          it('should build and save an assessment result with a validated status', async function () {
            // given
            const expectedEstimatedLevel = 2;
            const scoreForEstimatedLevel = 592;
            const challenges = _generateCertificationChallengeForScoringList({ length: maximumAssessmentLength });
            const answers = generateAnswersForChallenges({ challenges });
            const assessmentResultId = 123;

            certificationChallengeForScoringRepository.getByCertificationCourseId
              .withArgs({ certificationCourseId })
              .resolves(challenges);
            answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
            certificationCourseRepository.get.withArgs(certificationCourseId).resolves(certificationCourse);
            flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);
            flashAlgorithmService.getEstimatedLevelAndErrorRate
              .withArgs({
                challenges,
                allAnswers: answers,
                estimatedLevel: sinon.match.number,
                variationPercent: undefined,
                variationPercentUntil: undefined,
                doubleMeasuresUntil: undefined,
              })
              .returns({
                estimatedLevel: expectedEstimatedLevel,
              });
            assessmentResultRepository.save.resolves(domainBuilder.buildAssessmentResult({ id: assessmentResultId }));

            // when
            await handleCertificationScoring({
              event,
              certificationChallengeForScoringRepository,
              answerRepository,
              assessmentResultRepository,
              certificationCourseRepository,
              competenceForScoringRepository,
              competenceMarkRepository,
              scoringCertificationService,
              certificationAssessmentRepository,
              flashAlgorithmConfigurationRepository,
              flashAlgorithmService,
            });

            // then
            const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScoreV3({
              nbPix: scoreForEstimatedLevel,
              status: status.VALIDATED,
            });
            const expectedAssessmentResult = new AssessmentResult({
              pixScore: scoreForEstimatedLevel,
              reproducibilityRate: certificationAssessmentScore.getPercentageCorrectAnswers(),
              status: status.VALIDATED,
              assessmentId: certificationAssessment.id,
              emitter: 'PIX-ALGO',
            });
            expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
              certificationCourseId: 1234,
              assessmentResult: expectedAssessmentResult,
            });
            expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
              new CertificationCourse({
                ...certificationCourse.toDTO(),
                completedAt: now,
              }),
            );
            expect(competenceMarkRepository.save).to.have.been.calledWithExactly(
              domainBuilder.buildCompetenceMark({
                id: undefined,
                assessmentResultId: assessmentResultId,
                area_code: '1',
                competenceId: 'recCompetenceId',
                competence_code: '1.1',
                level: 2,
                score: 0,
              }),
            );
          });

          describe('when the certification would reach a very high score', function () {
            it('should return the score capped based on the maximum available level when the certification was done', async function () {
              // given
              const expectedEstimatedLevel = 8;
              const cappedScoreForEstimatedLevel = 896;
              const challenges = _generateCertificationChallengeForScoringList({ length: maximumAssessmentLength });

              const answers = generateAnswersForChallenges({ challenges });

              certificationChallengeForScoringRepository.getByCertificationCourseId
                .withArgs({ certificationCourseId })
                .resolves(challenges);
              answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
              certificationCourseRepository.get.withArgs(certificationCourseId).resolves(certificationCourse);
              flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);
              flashAlgorithmService.getEstimatedLevelAndErrorRate
                .withArgs({
                  challenges,
                  allAnswers: answers,
                  estimatedLevel: sinon.match.number,
                  variationPercent: undefined,
                  variationPercentUntil: undefined,
                  doubleMeasuresUntil: undefined,
                })
                .returns({
                  estimatedLevel: expectedEstimatedLevel,
                });

              // when
              await handleCertificationScoring({
                event,
                certificationChallengeForScoringRepository,
                answerRepository,
                assessmentResultRepository,
                certificationCourseRepository,
                competenceForScoringRepository,
                competenceMarkRepository,
                scoringCertificationService,
                certificationAssessmentRepository,
                flashAlgorithmConfigurationRepository,
                flashAlgorithmService,
              });

              // then
              const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScoreV3({
                nbPix: cappedScoreForEstimatedLevel,
                status: status.VALIDATED,
              });
              const expectedAssessmentResult = new AssessmentResult({
                pixScore: cappedScoreForEstimatedLevel,
                reproducibilityRate: certificationAssessmentScore.getPercentageCorrectAnswers(),
                status: status.VALIDATED,
                assessmentId: certificationAssessment.id,
                emitter: 'PIX-ALGO',
              });
              expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
                certificationCourseId: 1234,
                assessmentResult: expectedAssessmentResult,
              });
            });
          });
        });

        describe('when the certification was not completed', function () {
          describe('when the candidate did not finish due to technical difficulties', function () {
            it('should build and save an assessment result with a validated status with the raw score', async function () {
              // given
              const expectedEstimatedLevel = 2;
              const rawScore = 592;
              const challenges = _generateCertificationChallengeForScoringList({
                length: minimumAnswersRequiredToValidateACertification,
              });
              const abortReason = ABORT_REASONS.TECHNICAL;
              const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
                id: certificationCourseId,
                completedAt: null,
                abortReason,
              });

              const answers = generateAnswersForChallenges({ challenges });

              certificationChallengeForScoringRepository.getByCertificationCourseId
                .withArgs({ certificationCourseId })
                .resolves(challenges);
              answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
              certificationCourseRepository.get.withArgs(certificationCourseId).resolves(abortedCertificationCourse);
              flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);
              flashAlgorithmService.getEstimatedLevelAndErrorRate
                .withArgs({
                  challenges,
                  allAnswers: answers,
                  estimatedLevel: sinon.match.number,
                  variationPercent: undefined,
                  variationPercentUntil: undefined,
                  doubleMeasuresUntil: undefined,
                })
                .returns({
                  estimatedLevel: expectedEstimatedLevel,
                });

              // when
              await handleCertificationScoring({
                event,
                certificationChallengeForScoringRepository,
                answerRepository,
                assessmentResultRepository,
                certificationCourseRepository,
                competenceForScoringRepository,
                competenceMarkRepository,
                scoringCertificationService,
                certificationAssessmentRepository,
                flashAlgorithmConfigurationRepository,
                flashAlgorithmService,
              });

              // then
              const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScoreV3({
                nbPix: rawScore,
                status: status.VALIDATED,
              });
              const expectedAssessmentResult = new AssessmentResult({
                pixScore: rawScore,
                reproducibilityRate: certificationAssessmentScore.getPercentageCorrectAnswers(),
                status: status.VALIDATED,
                assessmentId: certificationAssessment.id,
                emitter: 'PIX-ALGO',
              });
              expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
                certificationCourseId: 1234,
                assessmentResult: expectedAssessmentResult,
              });
              expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
                new CertificationCourse({
                  ...certificationCourse.toDTO(),
                  completedAt: now,
                  abortReason,
                }),
              );
            });
          });

          describe('when the candidate did not finish in time', function () {
            it('should build and save an assessment result with a validated status with the degraded score', async function () {
              // given
              const expectedEstimatedLevel = 2;
              const degradedScore = 474;
              const challenges = _generateCertificationChallengeForScoringList({
                length: minimumAnswersRequiredToValidateACertification,
              });
              const abortReason = ABORT_REASONS.CANDIDATE;
              const abortedCertificationCourse = domainBuilder.buildCertificationCourse({
                id: certificationCourseId,
                completedAt: null,
                abortReason,
              });

              const answers = generateAnswersForChallenges({ challenges });

              certificationChallengeForScoringRepository.getByCertificationCourseId
                .withArgs({ certificationCourseId })
                .resolves(challenges);
              answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
              certificationCourseRepository.get.withArgs(certificationCourseId).resolves(abortedCertificationCourse);
              flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);
              flashAlgorithmService.getEstimatedLevelAndErrorRate
                .withArgs({
                  challenges,
                  allAnswers: answers,
                  estimatedLevel: sinon.match.number,
                  variationPercent: undefined,
                  variationPercentUntil: undefined,
                  doubleMeasuresUntil: undefined,
                })
                .returns({
                  estimatedLevel: expectedEstimatedLevel,
                });

              // when
              await handleCertificationScoring({
                event,
                certificationChallengeForScoringRepository,
                answerRepository,
                assessmentResultRepository,
                certificationCourseRepository,
                competenceForScoringRepository,
                competenceMarkRepository,
                scoringCertificationService,
                certificationAssessmentRepository,
                flashAlgorithmConfigurationRepository,
                flashAlgorithmService,
              });

              // then
              const certificationAssessmentScore = domainBuilder.buildCertificationAssessmentScoreV3({
                nbPix: degradedScore,
                status: status.VALIDATED,
              });
              const expectedAssessmentResult = new AssessmentResult({
                pixScore: degradedScore,
                reproducibilityRate: certificationAssessmentScore.getPercentageCorrectAnswers(),
                status: status.VALIDATED,
                assessmentId: certificationAssessment.id,
                emitter: 'PIX-ALGO',
              });
              expect(assessmentResultRepository.save).to.have.been.calledWithExactly({
                certificationCourseId: 1234,
                assessmentResult: expectedAssessmentResult,
              });
              expect(certificationCourseRepository.update).to.have.been.calledWithExactly(
                new CertificationCourse({
                  ...certificationCourse.toDTO(),
                  completedAt: now,
                  abortReason,
                }),
              );
            });
          });
        });
      });

      it('should return a CertificationScoringCompleted', async function () {
        // given
        const challenge1 = domainBuilder.buildCertificationChallengeForScoring();
        const challenge2 = domainBuilder.buildCertificationChallengeForScoring();
        const challenges = [challenge1, challenge2];
        const answer1 = domainBuilder.buildAnswer({ challengeId: challenge1.id, assessmentId });
        const answer2 = domainBuilder.buildAnswer({ challengeId: challenge2.id, assessmentId });
        const answers = [answer1, answer2];
        certificationChallengeForScoringRepository.getByCertificationCourseId
          .withArgs({ certificationCourseId })
          .resolves(challenges);
        answerRepository.findByAssessment.withArgs(assessmentId).resolves(answers);
        certificationCourseRepository.get.withArgs(certificationCourseId).resolves(certificationCourse);
        flashAlgorithmConfigurationRepository.get.resolves(baseFlashAlgorithmConfiguration);
        flashAlgorithmService.getEstimatedLevelAndErrorRate
          .withArgs({
            challenges,
            allAnswers: answers,
            estimatedLevel: sinon.match.number,
            variationPercent: undefined,
            variationPercentUntil: undefined,
            doubleMeasuresUntil: undefined,
          })
          .returns({
            estimatedLevel: 2,
          });

        // when
        const generatedEvent = await handleCertificationScoring({
          event,
          certificationAssessmentRepository,
          certificationChallengeForScoringRepository,
          answerRepository,
          assessmentResultRepository,
          competenceMarkRepository,
          competenceForScoringRepository,
          certificationCourseRepository,
          flashAlgorithmConfigurationRepository,
          flashAlgorithmService,
        });

        // then
        expect(generatedEvent).to.be.instanceOf(CertificationScoringCompleted);
        expect(generatedEvent.userId).to.equal(userId);
        expect(generatedEvent.certificationCourseId).to.equal(certificationCourseId);
        expect(generatedEvent.reproducibilityRate).to.equal(100);
      });
    });
  });

  context('when completed assessment is not of type CERTIFICATION', function () {
    it('should not do anything', async function () {
      // given
      const event = new AssessmentCompleted(
        Symbol('an assessment Id'),
        Symbol('userId'),
        Symbol('targetProfileId'),
        Symbol('campaignParticipationId'),
        false,
      );

      // when
      const certificationScoringCompleted = await handleCertificationScoring({
        event,
        assessmentResultRepository,
        certificationCourseRepository,
        competenceForScoringRepository,
        competenceMarkRepository,
        scoringCertificationService,
        certificationAssessmentRepository,
      });

      expect(certificationScoringCompleted).to.be.null;
    });
  });
});

const _generateCertificationChallengeForScoringList = ({ length }) => {
  return generateChallengeList({
    length,
  }).map(({ discriminant, difficulty }) => new CertificationChallengeForScoring({ discriminant, difficulty }));
};
