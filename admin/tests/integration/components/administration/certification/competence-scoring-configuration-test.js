import { render } from '@1024pix/ember-testing-library';
import { hbs } from 'ember-cli-htmlbars';
import { module, test } from 'qunit';

import setupIntlRenderingTest from '../../../../helpers/setup-intl-rendering';

module('Integration | Component |  administration/certification/competence-scoring-configuration', function (hooks) {
  setupIntlRenderingTest(hooks);

  test('should display all details', async function (assert) {
    // given
    // when
    const screen = await render(hbs`<Administration::Certification::CompetenceScoringConfiguration />`);

    // then
    assert.dom(screen.getByRole('heading', { name: 'Configuration des seuils par compétence', level: 2 })).exists();
    assert
      .dom(screen.getByRole('textbox', { name: 'Ajout de la configuration de niveau par compétence (JSON)' }))
      .exists();
    assert.dom(screen.getByRole('button', { name: 'Enregistrer' })).exists();
  });
});