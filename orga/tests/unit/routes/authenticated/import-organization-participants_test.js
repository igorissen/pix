import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';

import sinon from 'sinon';

module('Unit | Route | authenticated/import-organization-participant', function (hooks) {
  setupTest(hooks);

  module('beforeModel', function () {
    test('should redirect to application when shouldAccessImportPage is false', function (assert) {
      // given
      class CurrentUserStub extends Service {
        shouldAccessImportPage = false;
      }

      this.owner.register('service:current-user', CurrentUserStub);
      const route = this.owner.lookup('route:authenticated.import-organization-participants');
      const replaceWithStub = sinon.stub();
      route.router.replaceWith = replaceWithStub;

      // when
      route.beforeModel();

      // then
      sinon.assert.calledOnceWithExactly(replaceWithStub, 'application');
      assert.ok(true);
    });

    test('should not redirect to application when currentUser.isAdminInOrganization and currentUser.isSCOManagingStudents are true', function (assert) {
      // given
      class CurrentUserStub extends Service {
        shouldAccessImportPage = true;
      }

      this.owner.register('service:current-user', CurrentUserStub);
      const route = this.owner.lookup('route:authenticated.import-organization-participants');
      const replaceWithStub = sinon.stub();
      route.replaceWith = replaceWithStub;

      // when
      route.beforeModel();

      // then
      sinon.assert.notCalled(replaceWithStub);
      assert.ok(true);
    });
  });
});