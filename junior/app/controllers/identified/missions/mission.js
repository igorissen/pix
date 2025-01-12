import Controller from '@ember/controller';
import { action } from '@ember/object';
import { service } from '@ember/service';

export default class Mission extends Controller {
  @service router;

  @action
  async activeLoadingButton() {
    document.getElementsByClassName('details-action')[0].remove();
    document
      .getElementsByClassName('details-action__loader')[0]
      .classList.replace('details-action__loader', 'details-action__loader--visible');
  }

  get learningObjectives() {
    return this.model.learningObjectives.split('\n');
  }
}
