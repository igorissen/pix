const { checkEventTypes } = require('./check-event-types');
const NewChallengeAsked = require('./NewChallengeAsked');

const eventTypes = [ NewChallengeAsked ];

async function handleUpdateLastQuestionInformation({
  event,
  assessmentRepository,
}) {
  checkEventTypes(event, eventTypes);
  if (event.challengeId !== event.currentChallengeId) {
    await assessmentRepository.updateLastChallengeIdAsked({ id: event.assessmentId, lastChallengeId: event.challengeId });
    await assessmentRepository.updateLastQuestionState({ id: event.assessmentId, lastQuestionState: 'asked' });
  }
}

handleUpdateLastQuestionInformation.eventTypes = eventTypes;
module.exports = handleUpdateLastQuestionInformation;

