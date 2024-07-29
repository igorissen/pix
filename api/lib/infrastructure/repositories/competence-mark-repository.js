import { CompetenceMark } from '../../../src/certification/shared/domain/models/CompetenceMark.js';
import { DomainTransaction } from '../DomainTransaction.js';

const save = async function (competenceMark) {
  await competenceMark.validate();
  const knexConn = DomainTransaction.getConnection();
  const [savedCompetenceMark] = await knexConn('competence-marks')
    .insert(competenceMark)
    .onConflict('id')
    .merge()
    .returning('*');

  return new CompetenceMark(savedCompetenceMark);
};

export { save };
