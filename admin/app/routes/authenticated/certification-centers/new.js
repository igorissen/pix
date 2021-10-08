import Route from '@ember/routing/route';
import RSVP from 'rsvp';

export default class NewRoute extends Route {
  model() {
    return RSVP.hash({
      certificationCenter: this.store.createRecord('certification-center'),
      accreditations: this.store.findAll('accreditation'),
    });
  }
}
