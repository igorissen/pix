const { Serializer, Deserializer } = require('jsonapi-serializer');

const { WrongDateFormatError } = require('../../../domain/errors');
const { isValidDate } = require('../../utils/date-utils');

module.exports = {

  serialize(certification) {

    return new Serializer('certifications', {
      typeForAttribute(attribute) {
        if (attribute === 'resultCompetenceTree') {
          return 'result-competence-trees';
        }
        if (attribute === 'resultCompetences') {
          return 'result-competences';
        }
      },
      attributes: [
        'certificationCenter',
        'birthdate',
        'birthplace',
        'date',
        'firstName',
        'isPublished',
        'lastName',
        'status',
        'pixScore',
        'commentForCandidate',
        'resultCompetenceTree',
      ],

      resultCompetenceTree: {
        included: true,
        ref: 'id',
        // XXX: the jsonapi-serializer lib needs at least one attribute outside relationships
        attributes: ['id', 'areas'],

        areas: {
          included: true,
          ref: 'id',
          attributes: ['code', 'name', 'title', 'resultCompetences'],

          resultCompetences: {
            included: true,
            ref: 'id',
            type: 'result-competences',
            attributes: ['index', 'level', 'name', 'score'],
          },
        },
      },
    }).serialize(certification);
  },

  serializeFromCertificationCourse(certificationCourse) {
    return new Serializer('certifications', {
      attributes: ['firstName', 'lastName', 'birthplace', 'birthdate', 'externalId'],
    }).serialize(certificationCourse);
  },

  deserialize(json) {
    const birthdate = json.data.attributes.birthdate;

    return new Deserializer({ keyForAttribute: 'camelCase' })
      .deserialize(json)
      .then(((certifications) => {
        if (birthdate) {
          if (!isValidDate(birthdate)) {
            return Promise.reject(new WrongDateFormatError());
          }
        }
        return certifications;
      }));
  },
};
