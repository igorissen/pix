const createServer = require('../../../server');
const { expect, sinon } = require('../../test-helper');
const DomainErrors = require('../../../lib/domain/errors');

describe('Integration | API | Controller Error', () => {

  let server;
  const routeHandler = sinon.stub();
  const options = { method: 'GET', url: '/test_route' };

  function responseDetail(response)  {
    const payload = JSON.parse(response.payload);
    return payload.errors[0].detail;
  }

  beforeEach(async () => {
    server = await createServer();
    server.route({ method: 'GET', path: '/test_route', handler: routeHandler, config:  { auth: false } });

  });

  context('412 Precondition Failed', () => {
    const PRECONDITION_FAILED = 412;

    it('responds Precondition Failed when a AlreadyRatedAssessmentError error occurs', async () => {
      routeHandler.throws(new DomainErrors.AlreadyRatedAssessmentError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(PRECONDITION_FAILED);
      expect(responseDetail(response)).to.equal('Assessment is already rated.');
    });

    it('responds Precondition Failed when a CompetenceResetError error occurs', async () => {
      routeHandler.throws(new DomainErrors.CompetenceResetError(2));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(PRECONDITION_FAILED);
      expect(responseDetail(response)).to.equal('Il reste 2 jours avant de pouvoir réinitiliser la compétence.');
    });

    it('responds Precondition Failed when a AlreadyExistingMembershipError error occurs', async () => {
      routeHandler.throws(new DomainErrors.AlreadyExistingMembershipError('Le membership existe déjà.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(PRECONDITION_FAILED);
      expect(responseDetail(response)).to.equal('Le membership existe déjà.');
    });

    it('responds Precondition Failed when a AlreadyExistingOrganizationInvitationError error occurs', async () => {
      routeHandler.throws(new DomainErrors.AlreadyExistingOrganizationInvitationError('L\'invitation de l\'organisation existe déjà.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(PRECONDITION_FAILED);
      expect(responseDetail(response)).to.equal('L\'invitation de l\'organisation existe déjà.');
    });

    it('responds Precondition Failed when a AlreadySharedCampaignParticipationError error occurs', async () => {
      routeHandler.throws(new DomainErrors.AlreadySharedCampaignParticipationError('Ces résultats de campagne ont déjà été partagés.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(PRECONDITION_FAILED);
      expect(responseDetail(response)).to.equal('Ces résultats de campagne ont déjà été partagés.');
    });

    it('responds Precondition Failed when a AlreadyExistingCampaignParticipationError error occurs', async () => {
      routeHandler.throws(new DomainErrors.AlreadyExistingCampaignParticipationError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(PRECONDITION_FAILED);
    });
  });

  context('404 Not Found', () => {
    const NOT_FOUND_ERROR = 404;

    it('responds Not Found when a DomainError.NotFoundError error occurs', async () => {
      routeHandler.throws(new DomainErrors.NotFoundError('Entity Not Found'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(NOT_FOUND_ERROR);
      expect(responseDetail(response)).to.equal('Entity Not Found');
    });

    it('responds Not Found when a CampaignCodeError error occurs', async () => {
      routeHandler.throws(new DomainErrors.CampaignCodeError('Campaign Code Error'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(NOT_FOUND_ERROR);
      expect(responseDetail(response)).to.equal('Campaign Code Error');
    });

    it('responds Not Found when a CertificationCandidateByPersonalInfoNotFoundError error occurs', async () => {
      routeHandler.throws(new DomainErrors.CertificationCandidateByPersonalInfoNotFoundError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(NOT_FOUND_ERROR);
      expect(responseDetail(response)).to.equal('Aucun candidat de certification ne correspond aux informations d\'identité fournies.');
    });

    it('responds Not Found when a UserNotFoundError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotFoundError('Ce compte est introuvable.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(NOT_FOUND_ERROR);
      expect(responseDetail(response)).to.equal('Ce compte est introuvable.');
    });

    it('responds Not Found when a PasswordResetDemandNotFoundError error occurs', async () => {
      routeHandler.throws(new DomainErrors.PasswordResetDemandNotFoundError('La demande de réinitialisation de mot de passe n\'existe pas.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(NOT_FOUND_ERROR);
      expect(responseDetail(response)).to.equal('La demande de réinitialisation de mot de passe n\'existe pas.');
    });
  });

  context('409 Conflict', () => {
    const CONFLICT_ERROR = 409;

    it('responds Conflict when a CertificationCandidateByPersonalInfoTooManyMatchesError error occurs', async () => {
      routeHandler.throws(new DomainErrors.CertificationCandidateByPersonalInfoTooManyMatchesError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(CONFLICT_ERROR);
      expect(responseDetail(response)).to.equal('Plus d\'un candidat de certification correspondent aux informations d\'identité fournies.');
    });

    it('responds Conflict when a ChallengeAlreadyAnsweredError error occurs', async () => {
      routeHandler.throws(new DomainErrors.ChallengeAlreadyAnsweredError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(CONFLICT_ERROR);
      expect(responseDetail(response)).to.equal('This challenge has already been answered.');
    });

    it('responds Conflict when a AssessmentNotCompletedError error occurs', async () => {
      routeHandler.throws(new DomainErrors.AssessmentNotCompletedError('Cette évaluation n\'est pas terminée.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(CONFLICT_ERROR);
      expect(responseDetail(response)).to.equal('Cette évaluation n\'est pas terminée.');
    });

    it('responds Conflict when a SchoolingRegistrationAlreadyLinkedToUserError error occurs', async () => {
      routeHandler.throws(new DomainErrors.SchoolingRegistrationAlreadyLinkedToUserError('L\'élève est déjà rattaché à un compte utilisateur.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(CONFLICT_ERROR);
      expect(responseDetail(response)).to.equal('L\'élève est déjà rattaché à un compte utilisateur.');
    });

    it('responds Conflict when a SameNationalStudentIdInOrganizationError error occurs', async () => {
      routeHandler.throws(new DomainErrors.SameNationalStudentIdInOrganizationError('(ABC123)'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(CONFLICT_ERROR);
      expect(responseDetail(response)).to.equal('L’INE ABC123 est déjà présent pour cette organisation.');
    });
  });

  context('403 Forbidden', () => {
    const FORBIDDEN_ERROR = 403;

    it('responds Forbidden when a UserNotAuthorizedToAccessEntity error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToAccessEntity());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Utilisateur non autorisé à accéder à la ressource');
    });

    it('responds Forbidden when a UserNotAuthorizedToUpdateResourceError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToUpdateResourceError('Utilisateur non autorisé à mettre à jour à la ressource'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Utilisateur non autorisé à mettre à jour à la ressource');
    });

    it('responds Forbidden when a UserNotAuthorizedToCreateCampaignError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToCreateCampaignError('Utilisateur non autorisé à créer une campagne'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Utilisateur non autorisé à créer une campagne');

    });

    it('responds Forbidden when a UserNotAuthorizedToGetCertificationCoursesError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToGetCertificationCoursesError('Cet utilisateur n\'est pas autorisé à récupérer ces certification courses.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Cet utilisateur n\'est pas autorisé à récupérer ces certification courses.');
    });

    it('responds Forbidden when a CertificationCandidateAlreadyLinkedToUserError error occurs', async () => {
      routeHandler.throws(new DomainErrors.CertificationCandidateAlreadyLinkedToUserError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Le candidat de certification est déjà lié à un utilisateur.');
    });

    it('responds Forbidden when a CertificationCandidateForbiddenDeletionError error occurs', async () => {
      routeHandler.throws(new DomainErrors.CertificationCandidateForbiddenDeletionError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Il est interdit de supprimer un candidat de certification déjà lié à un utilisateur.');
    });

    it('responds Forbidden when a ForbiddenAccess error occurs', async () => {
      routeHandler.throws(new DomainErrors.ForbiddenAccess('Accès non autorisé.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Accès non autorisé.');
    });

    it('responds Forbidden when a UserAlreadyLinkedToCandidateInSessionError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserAlreadyLinkedToCandidateInSessionError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('L\'utilisateur est déjà lié à un candidat dans cette session.');
    });

    it('responds Forbidden when a UserNotAuthorizedToCertifyError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToCertifyError());
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('The user cannot be certified.');
    });

    it('responds Forbidden when a UserNotAuthorizedToGetCampaignResultsError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToGetCampaignResultsError('Cet utilisateur n\'est pas autorisé à récupérer les résultats de la campagne.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Cet utilisateur n\'est pas autorisé à récupérer les résultats de la campagne.');
    });

    it('responds Forbidden when a UserNotAuthorizedToUpdatePasswordError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToUpdatePasswordError('Cet utilisateur n\'est pas autorisé à récupérer les résultats de la campagne.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Cet utilisateur n\'est pas autorisé à récupérer les résultats de la campagne.');
    });

    it('responds Forbidden when a UserNotAuthorizedToCreateResourceError error occurs', async () => {
      routeHandler.throws(new DomainErrors.UserNotAuthorizedToCreateResourceError('Cet utilisateur n\'est pas autorisé à créer la ressource.'));
      const response = await server.inject(options);

      expect(response.statusCode).to.equal(FORBIDDEN_ERROR);
      expect(responseDetail(response)).to.equal('Cet utilisateur n\'est pas autorisé à créer la ressource.');
    });
  });
});
