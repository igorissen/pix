import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class AuthenticatedCertificationsController extends Controller {
  @service fileSaver;
  @service session;
  @service currentUser;
  @service notifications;
  @service intl;
  @service featureToggles;

  @tracked selectedDivision = '';

  @action
  onSelectDivision(event) {
    this.selectedDivision = event.target.value;
  }

  @action
  async downloadSessionResultFile(event) {
    event.preventDefault();

    try {
      if (_isDivisionInvalid(this.selectedDivision, this.model.options)) {
        throw new Error(
          this.intl.t('pages.certifications.errors.invalid-division', { selectedDivision: this.selectedDivision })
        );
      }

      const organizationId = this.currentUser.organization.id;
      const url = `/api/organizations/${organizationId}/certification-results?division=${this.selectedDivision}`;

      let token = '';

      if (this.session.isAuthenticated) {
        token = this.session.data.authenticated.access_token;
      }

      await this.fileSaver.save({ url, token });
    } catch (error) {
      if (_isErrorNotFound(error)) {
        this.notifications.info(
          this.intl.t('pages.certifications.errors.no-results', { selectedDivision: this.selectedDivision }),
          { autoClear: false }
        );
      } else {
        this.notifications.error(error.message, { autoClear: false });
      }
    }
  }

  @action
  async downloadAttestation() {
    try {
      if (_isDivisionInvalid(this.selectedDivision, this.model.options)) {
        throw new Error(
          this.intl.t('pages.certifications.errors.invalid-division', { selectedDivision: this.selectedDivision })
        );
      }

      const organizationId = this.currentUser.organization.id;
      const url = `/api/organizations/${organizationId}/certification-attestations?division=${this.selectedDivision}`;
      const fileName = 'attestations_pix.pdf';

      let token = '';

      if (this.session.isAuthenticated) {
        token = this.session.data.authenticated.access_token;
      }

      await this.fileSaver.save({ url, fileName, token });
    } catch (error) {
      if (_isErrorNotFound(error)) {
        this.notifications.info(
          this.intl.t('pages.certifications.errors.no-results', { selectedDivision: this.selectedDivision }),
          { autoClear: false }
        );
      }
      if (_isErrorNoResults(error)) {
        this.notifications.info(
          this.intl.t('pages.certifications.errors.no-certificates', { selectedDivision: this.selectedDivision }),
          { autoClear: false }
        );
      } else {
        this.notifications.error(error.message, { autoClear: false });
      }
    }
  }

  get firstTwoDivisions() {
    if (this.model.options.length < 2) {
      return '';
    }

    return `${this.model.options[0].label}, ${this.model.options[1].label} …`;
  }

  get isCertificationAttestationDownloadEnabled() {
    return this.featureToggles.featureToggles.isDownloadCertificationAttestationByDivisionEnabled;
  }
}

function _isDivisionInvalid(selectedDivision, divisions) {
  return !divisions.some((division) => division.label.toLowerCase() === selectedDivision.toLowerCase());
}

function _isErrorNotFound(error) {
  return error[0] && error[0].status == 404;
}

function _isErrorNoResults(error) {
  return error[0] && error[0].status == 400;
}
