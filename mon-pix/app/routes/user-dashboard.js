import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default class UserDashboard extends Route {
  @service currentUser;
  @service store;
  @service session;

  beforeModel(transition) {
    this.session.requireAuthenticationAndApprovedTermsOfService(transition);
  }

  async model() {
    const user = this.currentUser.user;
    const maximumDisplayed = 9;
    const queryParams = {
      'userId': user.id,
      'page[number]': 1,
      'page[size]': maximumDisplayed,
      'filter[states]': ['ONGOING', 'TO_SHARE'],
    };
    const campaignParticipationOverviews = await this.store.query('campaign-participation-overview', queryParams);

    const profile = await user.belongsTo('profile').reload();
    const scorecards = profile.scorecards;

    const campaignParticipations = await user.hasMany('campaignParticipations').reload();

    return {
      campaignParticipations,
      campaignParticipationOverviews,
      scorecards,
    };
  }
}
