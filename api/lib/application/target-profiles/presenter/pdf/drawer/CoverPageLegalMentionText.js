const Text = require('./Text.js');
const ColorManager = require('../manager/color-manager.js');
const FontManager = require('../manager/font-manager.js');
const PositionManager = require('../manager/position-manager.js');

const textByLang = {
  en: 'This is a working document, updated regularly. Its distribution is restricted and its use limited to Pix Orga members in the context of the implementation of the support of their users.',
  fr: "Ceci est un document de travail. Il évolue régulièrement. Sa diffusion est restreinte et son usage limité aux utilisateurs de Pix Orga dans le cadre de la mise en oeuvre de l'accompagnement de leurs publics.",
};

module.exports = class CoverPageLegaLMentionText extends Text {
  constructor({ language }) {
    const text = textByLang[language];
    super({
      text,
      positionX: PositionManager.coverPageLegalMentionHorizontalStart,
      positionY: PositionManager.coverPageLegalMentionVerticalStart,
      fontSize: FontManager.coverPageLegalMentionHeight,
      font: FontManager.coverPageLegalMentionFont,
      fontColor: ColorManager.coverPageLegalMentionColor,
      maxWidth: PositionManager.coverPageLegalMentionWidth,
    });
  }
};
