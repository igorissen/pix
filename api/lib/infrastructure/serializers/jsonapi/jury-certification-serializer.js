const { Serializer } = require('jsonapi-serializer');

module.exports = {
  serialize(juryCertification) {
    return new Serializer('certifications', {
      transform(juryCertification) {
        return {
          id: juryCertification.certificationCourseId,
          ...juryCertification,
          competencesWithMark: juryCertification.competenceMarks,
          cleaCertificationStatus: juryCertification.getCleaCertificationStatus(),
          pixPlusDroitMaitreCertificationStatus: juryCertification.getPixPlusDroitMaitreCertificationStatus(),
          pixPlusDroitExpertCertificationStatus: juryCertification.getPixPlusDroitExpertCertificationStatus(),
          pixPlusEduAutonomeCertificationStatus: juryCertification.getPixPlusEduAutonomeCertificationStatus(),
          pixPlusEduAvanceCertificationStatus: juryCertification.getPixPlusEduAvanceCertificationStatus(),
          pixPlusEduExpertCertificationStatus: juryCertification.getPixPlusEduExpertCertificationStatus(),
          pixPlusEduFormateurCertificationStatus: juryCertification.getPixPlusEduFormateurCertificationStatus(),
        };
      },
      attributes: [
        'sessionId',
        'assessmentId',
        'userId',
        'firstName',
        'lastName',
        'birthdate',
        'sex',
        'birthplace',
        'birthCountry',
        'birthINSEECode',
        'birthPostalCode',
        'createdAt',
        'completedAt',
        'status',
        'isPublished',
        'juryId',
        'pixScore',
        'competencesWithMark',
        'commentForCandidate',
        'commentForOrganization',
        'commentForJury',
        'cleaCertificationStatus',
        'pixPlusDroitMaitreCertificationStatus',
        'pixPlusDroitExpertCertificationStatus',
        'pixPlusEduAutonomeCertificationStatus',
        'pixPlusEduAvanceCertificationStatus',
        'pixPlusEduExpertCertificationStatus',
        'pixPlusEduFormateurCertificationStatus',
        'certificationIssueReports',
      ],
      certificationIssueReports: {
        ref: 'id',
        attributes: [
          'category',
          'description',
          'subcategory',
          'questionNumber',
          'isImpactful',
          'resolvedAt',
          'resolution',
        ],
      },
    }).serialize(juryCertification);
  },
};
