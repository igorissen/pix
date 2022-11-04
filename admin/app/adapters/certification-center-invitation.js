import ApplicationAdapter from './application';

export default class CertificationCenterInvitationAdapter extends ApplicationAdapter {
  namespace = 'api/admin';

  urlForQuery(query) {
    const { certificationCenterId } = query.filter;
    delete query.filter.certificationCenterId;

    return `${this.host}/${this.namespace}/certification-centers/${certificationCenterId}/invitations`;
  }

  queryRecord(store, type, query) {
    if (query.certificationCenterId) {
      const url = `${this.host}/${this.namespace}/certification-centers/${query.certificationCenterId}/invitations`;
      return this.ajax(url, 'POST', {
        data: { data: { attributes: { email: query.email, language: query.language } } },
      });
    }

    return super.queryRecord(...arguments);
  }
}
