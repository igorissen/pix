import { Factory, trait } from 'miragejs';

export default Factory.extend({
  skipped: trait({
    value: '#ABAND#',
    result: 'aband',
    resultDetails: 'null',
    timeout: null,
  }),

  afterCreate(answer, server) {
    if (!answer.correction) {
      answer.update({
        correction: server.create('correction'),
      });
    }
  },
});
