import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import Service from '@ember/service';
import sinon from 'sinon';

module('Unit | Route | authenticated/certifications', function(hooks) {
  setupTest(hooks);

  module('beforeModel', function(){
    test('should redirect to application when featureToggles.isCertificationResultsInOrgaEnabled is false', function(assert) {
      // given
      class CurrentUserStub extends Service {
        isSCOManagingStudents = true;
      }

      class FeatureToggleStub extends Service {
        isCertificationResultsInOrgaEnabled = false;
      }

      this.owner.register('service:current-user', CurrentUserStub);
      this.owner.register('service:feature-toggles', FeatureToggleStub);
      const route = this.owner.lookup('route:authenticated.certifications');
      const replaceWithStub = sinon.stub();
      route.replaceWith = replaceWithStub;

      // when
      route.beforeModel();

      // then
      sinon.assert.calledOnceWithExactly(replaceWithStub, 'application');
      assert.ok(true);
    });

    test('should redirect to application when currentUser.isSCOManagingStudents is false', function(assert) {
      // given
      class CurrentUserStub extends Service {
        isSCOManagingStudents = false;
      }

      class FeatureToggleStub extends Service {
        isCertificationResultsInOrgaEnabled = true;
      }

      this.owner.register('service:current-user', CurrentUserStub);
      this.owner.register('service:feature-toggles', FeatureToggleStub);
      const route = this.owner.lookup('route:authenticated.certifications');
      const replaceWithStub = sinon.stub();
      route.replaceWith = replaceWithStub;

      // when
      route.beforeModel();

      // then
      sinon.assert.calledOnceWithExactly(replaceWithStub, 'application');
      assert.ok(true);
    });

    test('should redirect to application when currentUser.isSCOManagingStudents and featureToggles.isCertificationResultsInOrgaEnabled are false', function(assert) {
      // given
      class CurrentUserStub extends Service {
        isSCOManagingStudents = false;
      }

      class FeatureToggleStub extends Service {
        isCertificationResultsInOrgaEnabled = false;
      }

      this.owner.register('service:current-user', CurrentUserStub);
      this.owner.register('service:feature-toggles', FeatureToggleStub);
      const route = this.owner.lookup('route:authenticated.certifications');
      const replaceWithStub = sinon.stub();
      route.replaceWith = replaceWithStub;

      // when
      route.beforeModel();

      // then
      sinon.assert.calledOnceWithExactly(replaceWithStub, 'application');
      assert.ok(true);
    });

    test('should redirect to application when currentUser.isSCOManagingStudents and featureToggles.isCertificationResultsInOrgaEnabled are true', function(assert) {
      // given
      class CurrentUserStub extends Service {
        isSCOManagingStudents = true;
      }

      class FeatureToggleStub extends Service {
        isCertificationResultsInOrgaEnabled = true;
      }

      this.owner.register('service:current-user', CurrentUserStub);
      this.owner.register('service:feature-toggles', FeatureToggleStub);
      const route = this.owner.lookup('route:authenticated.certifications');
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
