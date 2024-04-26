import { certificationCenterInvitationController } from '../../../../src/team/application/certification-center-invitation.controller.js';
import { usecases } from '../../../../src/team/domain/usecases/index.js';
import { expect, hFake, sinon } from '../../../test-helper.js';

describe('Unit | Team | Controller | certifications-center-controller', function () {
  describe('#sendInvitationForAdmin', function () {
    let certificationCenterInvitationSerializerStub;

    beforeEach(function () {
      certificationCenterInvitationSerializerStub = {
        deserializeForAdmin: sinon.stub(),
        serializeForAdmin: sinon.stub(),
      };

      sinon.stub(usecases, 'createOrUpdateCertificationCenterInvitationForAdmin');
    });

    it('should return 201 HTTP status code with data if there isn’t an already pending invitation', async function () {
      // given
      const email = 'some.user@example.net';
      const language = 'fr-fr';
      const role = null;
      const certificationCenterId = 7;
      const payload = {
        data: {
          type: 'certification-center-invitations',
          attributes: {
            email,
            language,
            role,
          },
        },
      };

      certificationCenterInvitationSerializerStub.deserializeForAdmin.withArgs(payload).resolves({
        email,
        language,
      });
      usecases.createOrUpdateCertificationCenterInvitationForAdmin
        .withArgs({
          email,
          locale: language,
          role,
          certificationCenterId,
        })
        .resolves({
          certificationCenterInvitation: 'an invitation',
          isInvitationCreated: true,
        });
      const serializedData = Symbol();
      certificationCenterInvitationSerializerStub.serializeForAdmin.withArgs('an invitation').returns(serializedData);

      // when
      const response = await certificationCenterInvitationController.sendInvitationForAdmin(
        {
          params: { certificationCenterId },
          payload,
        },
        hFake,
        {
          certificationCenterInvitationSerializer: certificationCenterInvitationSerializerStub,
        },
      );

      // then
      expect(response.source).to.equal(serializedData);
      expect(response.statusCode).to.equal(201);
    });

    it('should return 200 HTTP status code with data if there is already a pending existing invitation', async function () {
      // given
      const email = 'some.user@example.net';
      const language = 'fr-fr';
      const role = 'ADMIN';

      certificationCenterInvitationSerializerStub.deserializeForAdmin.resolves({ email, language });
      usecases.createOrUpdateCertificationCenterInvitationForAdmin.resolves({
        certificationCenterInvitation: 'an invitation',
        isInvitationCreated: false,
      });
      const serializedData = Symbol();
      certificationCenterInvitationSerializerStub.serializeForAdmin.returns(serializedData);

      // when
      const response = await certificationCenterInvitationController.sendInvitationForAdmin(
        {
          params: { certificationCenterId: 7 },
          payload: {
            data: {
              type: 'certification-center-invitations',
              attributes: {
                email,
                language,
                role,
              },
            },
          },
        },
        hFake,
        {
          certificationCenterInvitationSerializer: certificationCenterInvitationSerializerStub,
        },
      );

      // then
      expect(response.source).to.equal(serializedData);
      expect(response.statusCode).to.equal(200);
    });
  });
});