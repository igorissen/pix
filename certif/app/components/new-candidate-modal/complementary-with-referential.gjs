import PixRadioButton from '@1024pix/pix-ui/components/pix-radio-button';
import { t } from 'ember-intl';

<template>
  <div class='new-candidate-modal-form__field'>
    <fieldset id='is-complementary-alone'>
      <legend class='label'>
        {{t 'common.forms.certification-labels.complementary-alone'}}
      </legend>
      <PixRadioButton name='complementary-alone'>
        <:label>{{t 'common.labels.complementary-alone.pix-plus'}}</:label>
      </PixRadioButton>
      <PixRadioButton name='complementary-alone'>
        <:label>{{t 'common.labels.complementary-alone.pix-and-pix-plus'}}</:label>
      </PixRadioButton>
    </fieldset>
  </div>
</template>
