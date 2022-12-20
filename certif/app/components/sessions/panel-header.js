import Component from '@glimmer/component';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';

export default class PanelHeader extends Component {
  @service fileSaver;
  @service session;
  @service featureToggles;
  @service notifications;
  @service intl;
  @service currentUser;

  get shouldRenderImportTemplateButton() {
    return this.featureToggles.featureToggles.isMassiveSessionManagementEnabled;
  }

  @action
  async downloadSessionImportTemplate() {
    const url = '/api/sessions/import';
    const token = this.session.data.authenticated.access_token;
    try {
      await this.fileSaver.save({ url, token });
    } catch (e) {
      this.notifications.error(this.intl.t('pages.sessions.list.header.session-import-template-dl-error'));
    }
  }

  @action
  async importSessions(file) {
    const certificationCenterId = this.currentUser.currentAllowedCertificationCenterAccess.id;
    const url = `/api/certification-centers/${certificationCenterId}/sessions/import`;
    const token = this.session.data.authenticated.access_token;
    this.errorMessage = '';
    try {
      await file.upload(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await this.args.reloadSessionSummaries();
      this.notifications.success('La liste des sessions a été importée avec succès.');
    } catch (err) {
      this.notifications.error(err.body.errors[0].detail);
    }
  }
}
