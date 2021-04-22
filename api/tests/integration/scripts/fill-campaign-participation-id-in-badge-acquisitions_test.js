const { expect, databaseBuilder } = require('../../test-helper');

const {
  fillCampaignParticipationIdInBadgeAcquisitions,
  getCampaignParticipationFromBadgeAcquisition,
} = require('../../../scripts/fill-campaign-participation-id-in-badge-acquisitions');

describe.only('Integration | Scripts | fillCampaignParticipationIdInBadgeAcquisitions', () => {

  describe('#fillCampaignParticipationIdInBadgeAcquisitions', () => {

    it('should return badge-acquisitions without campaignParticipationId', async () => {
      // given
      const user = databaseBuilder.factory.buildUser();
      const badge = databaseBuilder.factory.buildBadge();
      databaseBuilder.factory.buildBadgeAcquisition({
        userId: user.id,
        badgeId: badge.id,
        campaignParticipationId: null,
      });
      const campaignParticipation = databaseBuilder.factory.buildCampaignParticipation();
      databaseBuilder.factory.buildBadgeAcquisition({
        userId: user.id,
        badgeId: badge.id,
        campaignParticipationId: campaignParticipation.id,
      });
      await databaseBuilder.commit();

      // when
      const result = await fillCampaignParticipationIdInBadgeAcquisitions();

      // then
      expect(result).to.have.lengthOf(1);
      expect(result[0].campaignParticipationId).to.equal(null);
    });

    it('should return possible campaignParticipations for one badge', async () => {
      // given
      const user = databaseBuilder.factory.buildUser();
      const targetProfile = databaseBuilder.factory.buildTargetProfile();
      const badge = databaseBuilder.factory.buildBadge({ targetProfileId: targetProfile.id });
      const badgeAcquisitionWithoutCampaignId = databaseBuilder.factory.buildBadgeAcquisition({
        userId: user.id,
        badgeId: badge.id,
        campaignParticipationId: null,
        createdAt: new Date('2020-01-01'),
      });
      const campaign = databaseBuilder.factory.buildCampaign({ targetProfileId: targetProfile.id });
      const campaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
        campaignId: campaign.id,
        userId: user.id,
      });
      databaseBuilder.factory.buildAssessment({
        campaignParticipationId: campaignParticipation.id,
        updatedAt: new Date('2020-01-01'),
        state: 'completed',
      });
      await databaseBuilder.commit();

      // when
      const result = await getCampaignParticipationFromBadgeAcquisition(badgeAcquisitionWithoutCampaignId);

      // then
      expect(result).to.deep.equal([{ id: campaignParticipation.id }]);
    });

    it('should return only campaignParticipations whose assessment has completed on same date as badge was acquired', async () => {
      // given
      const user = databaseBuilder.factory.buildUser();
      const targetProfile = databaseBuilder.factory.buildTargetProfile();
      const badge = databaseBuilder.factory.buildBadge({ targetProfileId: targetProfile.id });
      const badgeAcquisitionWithoutCampaignId = databaseBuilder.factory.buildBadgeAcquisition({
        userId: user.id,
        badgeId: badge.id,
        campaignParticipationId: null,
        createdAt: new Date('2020-01-01'),
      });
      const campaign = databaseBuilder.factory.buildCampaign({ targetProfileId: targetProfile.id });
      const campaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
        campaignId: campaign.id,
        userId: user.id,
      });

      const secondCampaign = databaseBuilder.factory.buildCampaign({ targetProfileId: targetProfile.id });
      const secondCampaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
        campaignId: secondCampaign.id,
        userId: user.id,
      });

      const thirdCampaign = databaseBuilder.factory.buildCampaign({ targetProfileId: targetProfile.id });
      const thirdCampaignParticipation = databaseBuilder.factory.buildCampaignParticipation({
        campaignId: thirdCampaign.id,
        userId: user.id,
      });
      databaseBuilder.factory.buildAssessment({
        campaignParticipationId: campaignParticipation.id,
        updatedAt: new Date('2020-01-01'),
        state: 'completed',
      });
      databaseBuilder.factory.buildAssessment({
        campaignParticipationId: secondCampaignParticipation.id,
        updatedAt: new Date('2020-02-01'),
        state: 'completed',
      });
      databaseBuilder.factory.buildAssessment({
        campaignParticipationId: thirdCampaignParticipation.id,
        updatedAt: new Date('2020-01-01'),
        state: 'started',
      });

      await databaseBuilder.commit();

      // when
      const result = await getCampaignParticipationFromBadgeAcquisition(badgeAcquisitionWithoutCampaignId);

      // then
      expect(result).to.deep.equal([ { id: campaignParticipation.id } ]);
    });
  });
});
