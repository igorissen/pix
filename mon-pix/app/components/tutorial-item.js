import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from '@glimmer/tracking';
import config from 'mon-pix/config/environment';

const statusTypes = {
  unsaved: 'unsaved',
  saving: 'saving',
  saved: 'saved',
};

export default class TutorialItemComponent extends Component {
  @service store;

  imageForFormat = {
    'vidéo': 'video',
    'son': 'son',
    'page': 'page'
  };
  isSavingTutorialFeatureEnabled = config.APP.FT_ACTIVATE_USER_TUTORIALS;
  @tracked status = statusTypes.unsaved;

  get tutorial() {
    return this.args.tutorial;
  }
  
  get formatImageName() {
    const format = this.args.tutorial.format;
    if (this.imageForFormat[format]) {
      return this.imageForFormat[format];
    }
    return 'page';
  }

  get isSaved() {
    return this.status === 'saved';
  }

  get saveButtonText() {
    switch (this.status) {
      case statusTypes.saved: return 'Enregistré';
      case statusTypes.saving: return 'Enregistrement en cours ...';
      default: return 'Enregistrer';
    }
  }

  get saveButtonTitle() {
    return this.status === statusTypes.saved ? 'Tuto déjà enregistré' : 'Enregistrer dans ma liste de tutos';
  }

  get isSaveButtonDisabled() {
    return this.status !== statusTypes.unsaved;
  }

  @action
  async saveTutorial() {
    this.status = statusTypes.saving;
    const userTutorial = this.store.createRecord('userTutorial', { tutorial: this.args.tutorial });
    await userTutorial.save({ adapterOptions: { tutorialId: this.args.tutorial.id } });
    this.status = statusTypes.saved;
  }

}
