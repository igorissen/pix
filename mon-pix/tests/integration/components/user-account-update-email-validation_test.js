import { expect } from 'chai';
import { describe, it } from 'mocha';
import setupIntlRenderingTest from '../../helpers/setup-intl-rendering';
import {
  find,
  render,
  triggerEvent,
} from '@ember/test-helpers';
import { fillInByLabel } from '../../helpers/fill-in-by-label';
import { clickByLabel } from '../../helpers/click-by-label';
import { contains } from '../../helpers/contains';
import hbs from 'htmlbars-inline-precompile';
import sinon from 'sinon';

describe('Integration | Component | User account update email validation', () => {

  setupIntlRenderingTest();

  context('when editing e-mail', function() {

    it('should display save and cancel button', async function() {
      // when
      await render(hbs`<UserAccountUpdateEmailValidation/>`);

      // then
      expect(find('[data-test-id="user-account-update-email-validation__cancel-button"]')).to.exist;
      expect(contains(this.intl.t('pages.user-account.account-update-email-validation.save-button'))).to.exist;
    });

    context('when the user cancel edition', function() {
      it('should call disableEmailValidationEditionMethod', async function() {
        // given
        const disableEmailValidationEditionMode = sinon.stub();
        this.set('disableEmailValidationEditionMode', disableEmailValidationEditionMode);

        await render(hbs`<UserAccountUpdateEmailValidation @disableEmailValidationEditionMode={{this.disableEmailValidationEditionMode}} />`);

        // when
        await clickByLabel(this.intl.t('pages.user-account.account-update-email-validation.cancel-button.aria-label'));

        // then
        sinon.assert.called(disableEmailValidationEditionMode);
      });
    });

    context('when the user fills inputs with errors', function() {

      context('in new email input', function() {

        it('should display a wrong format error message when focus-out', async function() {
          // given
          const invalidEmail = 'invalidEmail';

          await render(hbs`<UserAccountUpdateEmailValidation />`);

          // when
          await fillInByLabel(this.intl.t('pages.user-account.account-update-email-validation.fields.new-email.label'), invalidEmail);
          await triggerEvent('#newEmail', 'focusout');

          // then
          expect(contains(this.intl.t('pages.user-account.account-update-email-validation.fields.errors.wrong-email-format'))).to.exist;
        });
      });

      context('in password input', function() {

        it('should display an empty password error message when focus-out', async function() {
          // given
          const newEmail = 'newEmail@example.net';
          const emptyPassword = '';

          await render(hbs`<UserAccountUpdateEmailValidation />`);

          // when
          await fillInByLabel(this.intl.t('pages.user-account.account-update-email-validation.fields.new-email.label'), newEmail);
          await fillInByLabel(this.intl.t('pages.user-account.account-update-email-validation.fields.password.label'), emptyPassword);
          await triggerEvent('#password', 'focusout');

          // then
          expect(contains(this.intl.t('pages.user-account.account-update-email-validation.fields.errors.empty-password'))).to.exist;
        });
      });
    });
  });
});
