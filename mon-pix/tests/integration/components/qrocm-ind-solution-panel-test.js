import EmberObject from '@ember/object';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import { setupRenderingTest } from 'ember-mocha';
import { find, findAll, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const ANSWER = '.correction-qrocm__answer';
const INPUT = 'input.correction-qrocm__answer--input';
const TEXTAREA = 'textarea.correction-qrocm__answer--textarea';
const SOLUTION_BLOCK = '.correction-qrocm__solution';
const SOLUTION_TEXT = '.correction-qrocm__solution-text';

const NO_ANSWER_POSITION = 0;
const WRONG_ANSWER_POSITION = 1;
const CORRECT_ANSWER_POSITION = 2;

const CARIBBEAN_GREEN_COLOR = 'rgb(19, 201, 160)';

describe('Integration | Component | qrocm ind solution panel', function() {

  setupRenderingTest();

  const assessment = EmberObject.create({ id: 'assessment_id' });
  const challenge = EmberObject.create({
    id: 'challenge_id',
    proposals: 'blabla : ${key1}\nCarte mémoire (SD) : ${key2}\nanswer : ${key3}',
    format: 'petit'
  });
  const answer = EmberObject.create({
    id: 'answer_id',
    value: 'key1: \'\' key2: \'wrongAnswer2\' key3: \'rightAnswer3\'',
    resultDetails: 'key1: false\nkey2: false\nkey3: true',
    assessment,
    challenge
  });
  const solution = 'key1:\n- rightAnswer1\n' +
    'key2:\n- rightAnswer20\n- rightAnswer21\n' +
    'key3 :\n- rightAnswer3' ;

  [
    { format: 'petit' },
    { format: 'unreferenced_format' },
    { format: 'paragraphe' },
  ].forEach((data) => {
    describe('Whatever the format', function() {

      beforeEach(function() {
        this.set('answer', answer);
        this.set('solution', solution);
        this.set('challenge', challenge);
        this.challenge.set('format', data.format);
      });

      it('should contains three labels', async function() {
        // when
        await render(hbs`{{qrocm-ind-solution-panel answer=answer solution=solution challenge=challenge}}`);

        // then
        expect(findAll('label')).to.have.lengthOf(3);
      });

      describe('When the answer is correct', function() {

        it('should display the correct answer in green bold', async function() {
          // given
          const boldFontWeight = 700;

          // when
          await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

          // then
          const correctAnswerText = findAll(ANSWER)[CORRECT_ANSWER_POSITION];
          const correctAnswerStyle = window.getComputedStyle(correctAnswerText);

          expect(correctAnswerStyle.getPropertyValue('color')).to.equal(CARIBBEAN_GREEN_COLOR);
          expect(correctAnswerStyle.getPropertyValue('text-decoration')).to.include('none');
          expect(correctAnswerStyle.getPropertyValue('font-weight')).to.include(boldFontWeight);
        });

        it('should not display the solution block', async function() {
          // when
          await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

          // then
          const solutionBlockList = findAll(SOLUTION_BLOCK);
          const correctSolutionBlock = solutionBlockList[CORRECT_ANSWER_POSITION];

          expect(correctSolutionBlock).to.not.exist;
          expect(solutionBlockList).to.have.lengthOf(2);
        });
      });

      describe('When there is no answer', function() {
        it('should display one solution in bold green', async function() {
          // when
          await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

          // then
          const noAnswerSolutionBlock = findAll(SOLUTION_BLOCK)[NO_ANSWER_POSITION];
          const noAnswerSolutionText = findAll(SOLUTION_TEXT)[NO_ANSWER_POSITION];
          const noAnswerSolutionTextStyle = window.getComputedStyle(noAnswerSolutionText);

          expect(noAnswerSolutionBlock).to.exist;
          expect(noAnswerSolutionText).to.exist;
          expect(noAnswerSolutionTextStyle.getPropertyValue('color')).to.equal(CARIBBEAN_GREEN_COLOR);
          expect(noAnswerSolutionTextStyle.getPropertyValue('text-decoration')).to.include('none');
        });

        it('should display the empty answer with the default message "Pas de réponse" in italic', async function() {
          // given
          const emptyDefaultMessage = 'Pas de réponse';
          // when
          await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

          // then
          const answerInput = findAll(ANSWER)[NO_ANSWER_POSITION];
          const answerInputStyles = window.getComputedStyle(answerInput);

          expect(answerInput).to.exist;
          expect(findAll('label')[NO_ANSWER_POSITION]).to.exist;
          expect(answerInput.value).to.equal(emptyDefaultMessage);
          expect(answerInputStyles.getPropertyValue('text-decoration')).to.include('none');
          expect(answerInputStyles.getPropertyValue('font-style')).to.equal('italic');
        });
      });

      describe('When the answer is wrong', function() {
        it('should display one solution in bold green', async function() {
          // when
          await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

          // then
          const wrongSolutionBlock = findAll(SOLUTION_BLOCK)[WRONG_ANSWER_POSITION];
          const wrongSolutionText = findAll(SOLUTION_TEXT)[WRONG_ANSWER_POSITION];
          const wrongSolutionTextStyles = window.getComputedStyle(wrongSolutionText);

          expect(wrongSolutionBlock).to.exist;
          expect(wrongSolutionText).to.exist;
          expect(wrongSolutionTextStyles.getPropertyValue('color')).to.equal(CARIBBEAN_GREEN_COLOR);
          expect(wrongSolutionTextStyles.getPropertyValue('text-decoration')).to.include('none');
        });

        it('should display the wrong answer in line-throughed bold', async function() {
          // given
          const boldFontWeight = 400;

          // when
          await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

          // then
          const answerInput = findAll(ANSWER)[WRONG_ANSWER_POSITION];
          const answerInputStyles = window.getComputedStyle(answerInput);

          expect(answerInput).to.exist;
          expect(answerInputStyles.getPropertyValue('text-decoration')).to.include('line-through');
          expect(answerInputStyles.getPropertyValue('font-weight')).to.include(boldFontWeight);
        });
      });

    });
  });

  describe('When format is not a paragraph', function() {
    beforeEach(function() {
      this.set('answer', answer);
      this.set('solution', solution);
      this.set('challenge', challenge);
    });

    [
      { format: 'petit', expectedSize: '5' },
      { format: 'mots', expectedSize: '15' },
      { format: 'phrase', expectedSize: '50' },
      { format: 'unreferenced_format', expectedSize: '15' }
    ].forEach((data) => {
      it(`should display a disabled input with expected size (${data.expectedSize}) when format is ${data.format}`, async function() {
        //given
        this.challenge.set('format', data.format);

        //when
        await render(hbs`{{qrocm-ind-solution-panel challenge=challenge answer=answer solution=solution}}`);

        //then
        expect(find(TEXTAREA)).to.not.exist;
        expect(find(INPUT).tagName).to.equal('INPUT');
        expect(find(INPUT).getAttribute('size')).to.equal(data.expectedSize);
        expect(find(INPUT).hasAttribute('disabled')).to.be.true;
      });
    });

  });

  describe('When format is a paragraph', function() {
    beforeEach(function() {
      this.set('answer', answer);
      this.set('solution', solution);
      this.set('challenge', challenge);
      this.challenge.set('format', 'paragraphe');
    });

    it('should display a disabled textarea', async function() {
      // when
      await render(hbs`{{qrocm-ind-solution-panel answer=answer solution=solution challenge=challenge}}`);

      // then
      expect(find(INPUT)).to.not.exist;
      expect(find(TEXTAREA).tagName).to.equal('TEXTAREA');
      expect(find(TEXTAREA).hasAttribute('disabled')).to.be.true;
    });

  });

});
