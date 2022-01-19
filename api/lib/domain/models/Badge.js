class Badge {
  constructor({
    id,
    key,
    altMessage,
    imageUrl,
    message,
    title,
    isCertifiable,
    badgeCriteria = [],
    skillSets = [],
    targetProfileId,
    isAlwaysVisible = false,
  } = {}) {
    this.id = id;
    this.altMessage = altMessage;
    this.imageUrl = imageUrl;
    this.message = message;
    this.title = title;
    this.key = key;
    this.isCertifiable = isCertifiable;
    this.badgeCriteria = badgeCriteria;
    this.skillSets = skillSets;
    this.targetProfileId = targetProfileId;
    this.isAlwaysVisible = isAlwaysVisible;
  }
}

Badge.keys = {
  PIX_EMPLOI_CLEA: 'PIX_EMPLOI_CLEA',
  PIX_EMPLOI_CLEA_V2: 'PIX_EMPLOI_CLEA_V2',
  PIX_DROIT_MAITRE_CERTIF: 'PIX_DROIT_MAITRE_CERTIF',
  PIX_DROIT_EXPERT_CERTIF: 'PIX_DROIT_EXPERT_CERTIF',
  PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_INITIE: 'PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_INITIE',
  PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_CONFIRME: 'PIX_EDU_FORMATION_INITIALE_2ND_DEGRE_CONFIRME',
  PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_AVANCE: 'PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_AVANCE',
  PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_EXPERT: 'PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_EXPERT',
  PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_FORMATEUR: 'PIX_EDU_FORMATION_CONTINUE_2ND_DEGRE_FORMATEUR',
};

module.exports = Badge;
