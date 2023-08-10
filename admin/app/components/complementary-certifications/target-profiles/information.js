import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class Information extends Component {
  @tracked isToggled = true;

  get isMultipleCurrentTargetProfiles() {
    return this.args.complementaryCertification.currentTargetProfiles?.length > 1;
  }

  @action onChange() {
    this.isToggled = !this.isToggled;
    this.args.switchTargetProfile();
  }
}