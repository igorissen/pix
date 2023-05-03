import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
// eslint-disable-next-line no-restricted-imports
import { render } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';

module('Integration | Component |  <%= dasherizedModuleName %>', function (hooks) {
  setupRenderingTest(hooks);

  test('replace this by your real test', async function (assert) {
    // given

    //  when
    await render(hbs`<<%= classifiedModuleName %> />`);

    // then
    assert.strictEqual(true, true);
  });
});
