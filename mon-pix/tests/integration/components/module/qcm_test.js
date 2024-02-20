import { module, test } from 'qunit';
import { render } from '@1024pix/ember-testing-library';
import { hbs } from 'ember-cli-htmlbars';
import setupIntlRenderingTest from '../../../helpers/setup-intl-rendering';
import { click, findAll } from '@ember/test-helpers';
import sinon from 'sinon';

module('Integration | Component | Module | QCM', function (hooks) {
  setupIntlRenderingTest(hooks);

  test('should display a QCM', async function (assert) {
    // given
    const store = this.owner.lookup('service:store');
    const qcmElement = store.createRecord('qcm', {
      instruction: 'Instruction',
      proposals: [
        { id: '1', content: 'checkbox1' },
        { id: '2', content: 'checkbox2' },
        { id: '3', content: 'checkbox3' },
      ],
      type: 'qcms',
    });
    this.set('qcm', qcmElement);
    const screen = await render(hbs`<Module::Qcm @qcm={{this.qcm}} />`);

    // then
    assert.ok(screen);
    assert.strictEqual(findAll('.element-qcm-header__instruction').length, 1);
    assert.strictEqual(findAll('.element-qcm-header__direction').length, 1);
    assert.ok(screen.getByText('Instruction'));
    assert.ok(screen.getByText('Choisissez plusieurs réponses.'));

    assert.strictEqual(screen.getAllByRole('checkbox').length, qcmElement.proposals.length);
    assert.ok(screen.getByLabelText('checkbox1'));
    assert.ok(screen.getByLabelText('checkbox2'));
    assert.ok(screen.getByLabelText('checkbox3'));

    const verifyButton = screen.queryByRole('button', { name: 'Vérifier' });
    assert.dom(verifyButton).exists();
  });

  test('should call action when verify button is clicked', async function (assert) {
    // given
    const store = this.owner.lookup('service:store');
    const answeredProposal = [
      { id: '1', content: 'select1' },
      { id: '2', content: 'select2' },
    ];
    const qcmElement = store.createRecord('qcm', {
      id: 'qcm-id-1',
      instruction: 'Instruction',
      proposals: [
        { id: '1', content: 'select1' },
        { id: '2', content: 'select2' },
        { id: '3', content: 'select3' },
      ],
      type: 'qcms',
    });
    this.set('qcm', qcmElement);
    const userResponse = [answeredProposal[0].id, answeredProposal[1].id];
    const givenSubmitAnswerSpy = sinon.spy();
    this.set('submitAnswer', givenSubmitAnswerSpy);
    const screen = await render(hbs`<Module::Qcm @qcm={{this.qcm}} @submitAnswer={{this.submitAnswer}} />`);
    const verifyButton = screen.queryByRole('button', { name: 'Vérifier' });

    // when
    await click(screen.getByLabelText(answeredProposal[0].content));
    await click(screen.getByLabelText(answeredProposal[1].content));
    await click(verifyButton);

    // then
    sinon.assert.calledWith(givenSubmitAnswerSpy, { userResponse, element: qcmElement });
    assert.ok(true);
  });

  test('should display an ok feedback when exists', async function (assert) {
    // given
    const store = this.owner.lookup('service:store');

    const correctionResponse = store.createRecord('correction-response', {
      feedback: 'Good job!',
      status: 'ok',
      solution: ['1', '4'],
    });

    prepareContextRecords.call(this, store, correctionResponse);
    this.set('submitAnswer', () => {});

    // when
    const screen = await render(
      hbs`<Module::Qcm @qcm={{this.qcm}} @submitAnswer={{this.submitAnswer}} @correction={{this.correctionResponse}} />`,
    );

    // then
    const status = screen.getByRole('status');
    assert.strictEqual(status.innerText, 'Good job!');
    assert.ok(screen.getByRole('group').disabled);
    assert.dom(screen.queryByRole('button', { name: 'Vérifier' })).doesNotExist();
  });

  test('should display a ko feedback when exists', async function (assert) {
    // given
    const store = this.owner.lookup('service:store');
    const correctionResponse = store.createRecord('correction-response', {
      feedback: 'Too Bad!',
      status: 'ko',
      solution: ['1', '4'],
    });

    prepareContextRecords.call(this, store, correctionResponse);
    this.set('submitAnswer', () => {});

    // when
    const screen = await render(
      hbs`<Module::Qcm @qcm={{this.qcm}} @submitAnswer={{this.submitAnswer}} @correction={{this.correctionResponse}} />`,
    );

    // then
    const status = screen.getByRole('status');
    assert.strictEqual(status.innerText, 'Too Bad!');
    assert.ok(screen.getByRole('group').disabled);
    assert.dom(screen.queryByRole('button', { name: 'Vérifier' })).doesNotExist();
  });

  test('should display an error message if QCM is validated with less than two responses', async function (assert) {
    // given
    const store = this.owner.lookup('service:store');
    const qcmElement = store.createRecord('qcm', {
      instruction: 'Instruction',
      proposals: [
        { id: '1', content: 'checkbox1' },
        { id: '2', content: 'checkbox2' },
        { id: '3', content: 'checkbox3' },
      ],
      type: 'qcms',
    });
    this.set('qcm', qcmElement);
    const screen = await render(hbs`<Module::Qcm @qcm={{this.qcm}} @submitAnswer={{this.submitAnswer}} />`);

    // when
    await click(screen.getByLabelText('checkbox1'));
    await click(screen.queryByRole('button', { name: 'Vérifier' }));

    // then
    assert.dom(screen.getByRole('alert')).exists();
  });

  test('should hide the error message when QCM is validated with response', async function (assert) {
    // given
    const store = this.owner.lookup('service:store');
    const qcmElement = store.createRecord('qcm', {
      instruction: 'Instruction',
      proposals: [
        { id: '1', content: 'checkbox1' },
        { id: '2', content: 'checkbox2' },
        { id: '3', content: 'checkbox3' },
      ],
      type: 'qcms',
    });
    const givenSubmitAnswerStub = function () {};
    this.set('submitAnswer', givenSubmitAnswerStub);
    this.set('qcm', qcmElement);
    const screen = await render(hbs`<Module::Qcm @qcm={{this.qcm}} @submitAnswer={{this.submitAnswer}} />`);

    // when
    await click(screen.queryByRole('button', { name: 'Vérifier' }));
    await click(screen.getByLabelText('checkbox1'));
    await click(screen.queryByRole('button', { name: 'Vérifier' }));

    // then
    assert.dom(screen.queryByRole('alert', { name: 'Pour valider, sélectionnez une réponse.' })).doesNotExist();
  });
});

function prepareContextRecords(store, correctionResponse) {
  const elementAnswer = store.createRecord('element-answer', {
    correction: correctionResponse,
  });
  const qcmElement = store.createRecord('qcm', {
    instruction: 'Instruction',
    proposals: [
      { id: '1', content: 'checkbox1' },
      { id: '2', content: 'checkbox2' },
      { id: '3', content: 'checkbox3' },
    ],
    type: 'qcms',
    elementAnswers: [elementAnswer],
  });
  store.createRecord('grain', { id: 'id', elements: [qcmElement] });
  store.createRecord('element-answer', {
    correction: correctionResponse,
    element: qcmElement,
  });
  this.set('qcm', qcmElement);
  this.set('correctionResponse', correctionResponse);
}