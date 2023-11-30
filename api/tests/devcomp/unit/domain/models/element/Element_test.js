import { expect } from '../../../../../test-helper.js';
import { QCU } from '../../../../../../src/devcomp/domain/models/element/QCU.js';
import { Text } from '../../../../../../src/devcomp/domain/models/element/Text.js';
import { Image } from '../../../../../../src/devcomp/domain/models/element/Image.js';

describe('Unit | Devcomp | Domain | Models | Element', function () {
  describe('#isAnswerable', function () {
    it('should instanciate answerable elements', function () {
      // Given
      const qcu = new QCU({
        id: '123',
        instruction: 'instruction',
        locales: ['fr-FR'],
        proposals: [Symbol('proposal1'), Symbol('proposal2')],
      });

      const answerableElements = [qcu];

      // Then
      answerableElements.forEach((element) => expect(element.isAnswerable).to.be.true);
    });

    it('should instanciate non answerable elements', function () {
      // Given
      const text = new Text({ id: 'id', content: 'content' });
      const image = new Image({ id: 'id', url: 'url', alt: 'alt', alternativeText: 'alternativeText' });

      const nonAnswerableElements = [text, image];

      // Then
      nonAnswerableElements.forEach((element) => expect(element.isAnswerable).to.be.false);
    });
  });
});