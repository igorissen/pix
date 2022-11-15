import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Service | errors', function (hooks) {
  setupTest(hooks);

  module('#push', function () {
    test('should add error in errors array', function (assert) {
      // given
      const service = this.owner.lookup('service:errors');
      const error = 'newError';

      // when
      service.push(error);

      // then
      assert.equal(service.errors[0], error);
    });
  });

  module('#shift', function () {
    test('should return first error and remove it', function (assert) {
      // given
      const service = this.owner.lookup('service:errors');
      const error1 = 'newError1';
      const error2 = 'newError2';
      service.push(error1);
      service.push(error2);

      // when
      const result = service.shift();

      // then
      assert.equal(result, error1);
      assert.equal(service.errors.length, 1);
    });
  });

  module('#hasErrors', function () {
    test('should return true if there is errors', function (assert) {
      // given
      const service = this.owner.lookup('service:errors');
      const error = 'newError';
      service.push(error);

      // when
      const result = service.hasErrors();

      // then
      assert.equal(result, true);
    });

    test('should return false if there is no error', function (assert) {
      // given
      const service = this.owner.lookup('service:errors');

      // when
      const result = service.hasErrors();

      // then
      assert.equal(result, false);
    });
  });
});
