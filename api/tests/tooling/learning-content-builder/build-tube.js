const buildTube = function ({
  id = 'recTube123',
  name = '@tubeName',
  practicalTitle_i18n = {
    fr: 'titre pratique',
  },
  practicalDescription_i18n = {
    fr: 'description pratique',
  },
  isMobileCompliant = false,
  isTabletCompliant = false,
  competenceId = 'recCOMP123',
  thematicId = 'thematic123',
  skillIds = ['skillABC', 'skillDEF'],
} = {}) {
  return {
    id,
    name,
    practicalTitle_i18n,
    practicalDescription_i18n,
    isMobileCompliant,
    isTabletCompliant,
    competenceId,
    thematicId,
    skillIds,
  };
};

export { buildTube };
