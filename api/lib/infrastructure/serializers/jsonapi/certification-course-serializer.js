const { Serializer } = require('jsonapi-serializer');
const CertificationCourse = require('../../../domain/models/CertificationCourse');

const { WrongDateFormatError } = require('../../../domain/errors');
const { isValidDate } = require('../../utils/date-utils');

module.exports = {

  serialize(certificationCourse) {

    return new Serializer('course', {
      attributes: ['userId', 'assessment', 'type', 'nbChallenges'],
      assessment: {
        ref: 'id',
      },
      transform(record) {
        record.userId = record.userId.toString();
        record.type = 'CERTIFICATION';
        return record;
      },
    }).serialize(certificationCourse);
  },

  serializeResult(certificationCourseResult) {
    return new Serializer('results', {
      attributes: [
        'certificationId',
        'assessmentId',
        'level',
        'pixScore',
        'createdAt',
        'resultCreatedAt',
        'status',
        'completedAt',
        'emitter',
        'juryId',
        'commentForCandidate',
        'commentForOrganization',
        'commentForJury',
        'competencesWithMark',
        'firstName',
        'lastName',
        'birthdate',
        'birthplace',
        'sessionId',
        'externalId',
        'isPublished',
        'isV2Certification',
      ],
    }).serialize(certificationCourseResult);
  },

  deserialize(json) {
    if (!isValidDate(json.data.attributes.birthdate)) {
      throw new WrongDateFormatError();
    }

    return CertificationCourse.fromAttributes({
      id: json.data.id,
      createdAt: json.data.attributes.createdAt,
      updatedAt: json.data.attributes.updatedAt,
      userId: json.data.attributes.userId,
      completedAt: json.data.attributes.completedAt,
      firstName: json.data.attributes.firstName,
      lastName: json.data.attributes.lastName,
      birthdate: json.data.attributes.birthdate,
      birthplace: json.data.attributes.birthplace,
      isV2Certification: json.data.attributes.isV2Certification,
    });
  },
};
