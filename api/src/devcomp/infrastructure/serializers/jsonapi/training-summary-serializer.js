import jsonapiSerializer from 'jsonapi-serializer';

const { Serializer } = jsonapiSerializer;

const serialize = function (trainingSummaries, meta) {
  return new Serializer('training-summaries', {
    attributes: ['title', 'targetProfilesCount', 'prerequisiteThreshold', 'goalThreshold', 'isDisabled'],
    meta,
  }).serialize(trainingSummaries);
};

export { serialize };
