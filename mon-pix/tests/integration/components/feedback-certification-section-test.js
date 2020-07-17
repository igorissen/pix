import { expect } from 'chai';
import { describe, it } from 'mocha';
import setupIntegration from '../../helpers/setup-integration';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

describe('Integration | Component | feedback-certification-section', function() {
  setupIntegration();

  it('renders', async function() {

    await render(hbs`{{feedback-certification-section}}`);

    expect(find('.feedback-certification-section__div').textContent.trim()).to.contain('Pour signaler un problème, appelez votre surveillant et communiquez-lui les informations suivantes :');
  });
});
