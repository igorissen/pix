import { copyTargetProfile } from '../../../../../../src/prescription/target-profile/domain/usecases/copy-target-profile.js';
import { expect, sinon } from '../../../../../test-helper.js';
import { buildTargetProfile } from '../../../../../tooling/domain-builder/factory/index.js';

describe('Unit | UseCase | copy-target-profile', function () {
  let targetProfileRepositoryStub;
  let targetProfileAdministrationRepositoryStub;
  let badgeRepositoryStub;
  let badgeCriteriaRepositoryStub;

  beforeEach(function () {
    targetProfileRepositoryStub = {
      get: sinon.stub(),
    };

    targetProfileAdministrationRepositoryStub = {
      create: sinon.stub(),
      getTubesByTargetProfileId: sinon.stub(),
    };

    badgeRepositoryStub = {
      findAllByTargetProfileId: sinon.stub(),
      saveAll: sinon.stub(),
    };

    badgeCriteriaRepositoryStub = {
      findAllByBadgeIds: sinon.stub(),
    };
  });

  it('should copy a target profile', async function () {
    // given
    const targetProfileId = Symbol('targetProfileId');
    const targetProfileToCopy = buildTargetProfile({
      id: targetProfileId,
    });
    const copiedTargetProfileIdSymbol = Symbol('copiedTargetProfileIdSymbol');

    targetProfileRepositoryStub.get.withArgs(targetProfileId).resolves(targetProfileToCopy);
    const targetProfileTubes = [
      { tubeId: 123, level: 1 },
      { tubeId: 456, level: 2 },
    ];
    targetProfileAdministrationRepositoryStub.getTubesByTargetProfileId
      .withArgs(targetProfileId)
      .resolves(targetProfileTubes);

    targetProfileAdministrationRepositoryStub.create.resolves(copiedTargetProfileIdSymbol);

    // when
    const copiedTargetProfileId = await copyTargetProfile({
      targetProfileId: targetProfileId,
      targetProfileRepository: targetProfileRepositoryStub,
      targetProfileAdministrationRepository: targetProfileAdministrationRepositoryStub,
      badgeRepository: badgeRepositoryStub,
      badgeCriteriaRepository: badgeCriteriaRepositoryStub,
    });

    // then
    expect(copiedTargetProfileId).to.equal(copiedTargetProfileIdSymbol);
  });
});
