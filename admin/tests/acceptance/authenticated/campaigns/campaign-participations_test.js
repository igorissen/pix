import { module, test } from 'qunit';
import { currentURL } from '@ember/test-helpers';
import { visit } from '@1024pix/ember-testing-library';
import { setupApplicationTest } from 'ember-qunit';
import { authenticateAdminMemberWithRole } from 'pix-admin/tests/helpers/test-init';

import setupMirage from 'ember-cli-mirage/test-support/setup-mirage';

module('Acceptance | Campaign Participations', function (hooks) {
  setupApplicationTest(hooks);
  setupMirage(hooks);

  module('When user is not logged in', function () {
    test('it should not be accessible by an unauthenticated user', async function (assert) {
      // when
      await visit('/campaigns/1/participations');

      // then
      assert.strictEqual(currentURL(), '/login');
    });
  });

  module('When user is logged in', function () {
    test('it should display campaign participations', async function (assert) {
      // given
      await authenticateAdminMemberWithRole({ role: 'SUPER_ADMIN' })(server);
      server.create('campaign', { id: 1, name: 'Campaign name' });
      server.create('campaign-participation', { firstName: 'Georgette', lastName: 'Frimousse' });

      // when
      const screen = await visit('/campaigns/1/participations');

      // then
      assert.strictEqual(currentURL(), '/campaigns/1/participations');
      assert.dom(screen.getByText('Georgette Frimousse')).exists();
    });
  });
});
