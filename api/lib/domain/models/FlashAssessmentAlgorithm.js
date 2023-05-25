import { AssessmentEndedError } from '../errors.js';
import {
  getPossibleNextChallenges,
  getEstimatedLevelAndErrorRate,
  getReward,
} from '../services/algorithm-methods/flash.js';

class FlashAssessmentAlgorithm {
  getPossibleNextChallenges({ allAnswers, challenges, estimatedLevel }) {
    const { possibleChallenges, hasAssessmentEnded } = getPossibleNextChallenges({
      allAnswers,
      challenges,
      estimatedLevel,
    });

    if (hasAssessmentEnded) {
      throw new AssessmentEndedError();
    }

    return possibleChallenges;
  }

  getEstimatedLevelAndErrorRate({ allAnswers, challenges }) {
    return getEstimatedLevelAndErrorRate({ allAnswers, challenges });
  }

  getReward({ estimatedLevel, discriminant, difficulty }) {
    return getReward({ estimatedLevel, discriminant, difficulty });
  }
}

export { FlashAssessmentAlgorithm };
