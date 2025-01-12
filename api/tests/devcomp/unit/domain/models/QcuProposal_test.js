import { QcuProposal } from '../../../../../src/devcomp/domain/models/QcuProposal.js';
import { expect } from '../../../../test-helper.js';

describe('Unit | Devcomp | Domain | Models | QcuProposal', function () {
  describe('#constructor', function () {
    it('should create a QCU proposal with correct attributes', function () {
      // given
      const id = '1';
      const content = 'vrai';

      // when
      const proposal = new QcuProposal({ id, content });

      // then
      expect(proposal).not.to.be.undefined;
      expect(proposal.id).to.equal(id);
      expect(proposal.content).to.equal(content);
    });
  });

  describe('A QCU proposal without id', function () {
    it('should throw an error', function () {
      expect(() => new QcuProposal({})).to.throw('The id is required for a QCU proposal.');
    });
  });

  describe('A QCU proposal without content', function () {
    it('should throw an error', function () {
      expect(() => new QcuProposal({ id: '1' })).to.throw('The content is required for a QCU proposal.');
    });
  });
});
