import challenge from '../challenges/ref-timed-challenge-bis';

export default {
  data: {
    type: 'answers',
    id: 'ref_timed_answer_bis_id',
    attributes: {
      value: '',
      result: 'aband'
    },
    relationships: {
      challenge: {
        data: {
          type: 'challenges',
          id: challenge.data.id
        }
      },
      assessment: {
        data: {
          type: 'assessments',
          id: 'ref_timed_challenge_assessment_id'
        }
      }
    }
  }
};

