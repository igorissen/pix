import { config } from '../../../../shared/config.js';
import { status as CertificationStatus } from '../../../../shared/domain/models/AssessmentResult.js';
import { Intervals } from './Intervals.js';

class CertificationAssessmentScoreV3 {
  constructor({ nbPix, percentageCorrectAnswers = 100, status = CertificationStatus.VALIDATED, competenceMarks }) {
    this.nbPix = nbPix;
    this.percentageCorrectAnswers = percentageCorrectAnswers;
    this._status = status;
    this._competenceMarks = competenceMarks;
  }

  static fromChallengesAndAnswers({
    algorithm,
    challenges,
    allAnswers,
    abortReason,
    maxReachableLevelOnCertificationDate,
    v3CertificationScoring = [],
  }) {
    const certificationScoringIntervals = v3CertificationScoring.getIntervals();
    const numberOfIntervals = v3CertificationScoring.getNumberOfIntervals();

    const { capacity } = algorithm.getCapacityAndErrorRate({
      challenges,
      allAnswers,
    });

    const nbPix = _calculateScore({
      capacity,
      maxReachableLevelOnCertificationDate,
      certificationScoringIntervals,
      numberOfIntervals,
    });

    const competenceMarks = v3CertificationScoring.getCompetencesScore(capacity);

    const status = _isCertificationRejected({ answers: allAnswers, abortReason })
      ? CertificationStatus.REJECTED
      : CertificationStatus.VALIDATED;

    return new CertificationAssessmentScoreV3({
      nbPix,
      status,
      competenceMarks,
    });
  }

  get status() {
    return this._status;
  }

  get competenceMarks() {
    return this._competenceMarks;
  }

  getPercentageCorrectAnswers() {
    return this.percentageCorrectAnswers;
  }
}

const _calculateScore = ({ capacity, certificationScoringIntervals }) => {
  const MAX_PIX_SCORE = 1024;
  const numberOfIntervals = certificationScoringIntervals.length;
  const SCORE_THRESHOLD = MAX_PIX_SCORE / numberOfIntervals;
  const MAX_REACHABLE_LEVEL = 7;
  const NUMBER_OF_COMPETENCES = 16;
  const MIN_PIX_SCORE = 0;
  const PIX_PER_LEVEL = 8;
  const maximumReachableScore = MAX_REACHABLE_LEVEL * NUMBER_OF_COMPETENCES * PIX_PER_LEVEL - 1;

  const scoringIntervals = new Intervals({ intervals: certificationScoringIntervals });

  const intervalIndex = scoringIntervals.findIntervalIndex(capacity);
  const valueToIntervalMax = scoringIntervals.toIntervalMax(intervalIndex, capacity);
  const intervalWidth = scoringIntervals.intervalWidth(intervalIndex);

  if (scoringIntervals.isCapacityBelowMinimum(capacity)) {
    return MIN_PIX_SCORE;
  }

  if (scoringIntervals.isCapacityAboveMaximum(capacity)) {
    return maximumReachableScore;
  }

  const score = Math.ceil(SCORE_THRESHOLD * (intervalIndex + 1 + valueToIntervalMax / intervalWidth)) - 1;
  return Math.min(maximumReachableScore, score);
};

const _isCertificationRejected = ({ answers, abortReason }) => {
  return !_hasCandidateAnsweredEnoughQuestions({ answers }) && abortReason;
};

const _hasCandidateAnsweredEnoughQuestions = ({ answers }) => {
  return answers.length >= config.v3Certification.scoring.minimumAnswersRequiredToValidateACertification;
};

export { CertificationAssessmentScoreV3 };
