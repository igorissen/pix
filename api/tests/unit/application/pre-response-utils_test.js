import { BaseHttpError } from '../../../lib/application/http-errors.js';
import { handleDomainAndHttpErrors } from '../../../lib/application/pre-response-utils.js';
import { DomainError } from '../../../src/shared/domain/errors.js';
import { expect, hFake, sinon } from '../../test-helper.js';

describe('Unit | Application | PreResponse-utils', function () {
  describe('#handleDomainAndHttpErrors', function () {
    let errorManager;

    beforeEach(function () {
      errorManager = {
        handle: sinon.stub().resolves(),
      };
    });

    it('should continue the process when not DomainError or BaseHttpError', async function () {
      // given
      const request = {
        response: {
          statusCode: 200,
        },
      };
      const expectedString = 'Symbol(continue)';

      // when
      const response = await handleDomainAndHttpErrors(request, hFake, { errorManager });

      // then
      expect(typeof response).to.be.equal('symbol');
      expect(response.toString()).to.be.equal(expectedString);
    });

    it('should not manage (src/shared) DomainError', async function () {
      const request = {
        response: new DomainError('Error message'),
      };

      // when
      await handleDomainAndHttpErrors(request, hFake, { errorManager });

      // then
      expect(errorManager.handle).not.to.have.been.calledWithExactly(request, hFake, request.response);
    });

    it('should manage BaseHttpError', async function () {
      const request = {
        response: new BaseHttpError('Error message'),
      };

      // when
      await handleDomainAndHttpErrors(request, hFake, { errorManager });

      // then
      expect(errorManager.handle).to.have.been.calledWithExactly(request, hFake, request.response);
    });
  });
});
