import { memberAction } from '@1024pix/ember-api-actions';
import { service } from '@ember/service';
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';

import formatList from '../utils/format-select-options';

export const categories = {
  OTHER: 'Autres',
  DISCIPLINE: 'Disciplinaires',
  COMPETENCES: 'Les 16 compétences',
  PREDEFINED: 'Parcours prédéfinis',
  CUSTOM: 'Parcours sur-mesure',
  PIX_PLUS: 'Pix+',
  SUBJECT: 'Thématiques',
  TARGETED: 'Parcours ciblés',
  BACK_TO_SCHOOL: 'Parcours de rentrée / 6e',
};

export const optionsCategoryList = formatList(categories);

export default class TargetProfile extends Model {
  @service session;

  @attr('nullable-string') name;
  @attr('boolean') isPublic;
  @attr('date') createdAt;
  @attr('nullable-string') imageUrl;
  @attr('boolean') outdated;
  @attr('nullable-text') description;
  @attr('nullable-text') comment;
  @attr('string') ownerOrganizationId;
  @attr('string') category;
  @attr('boolean') isSimplifiedAccess;
  @attr('boolean') areKnowledgeElementsResettable;
  @attr('boolean') hasLinkedCampaign;
  @attr('boolean') hasLinkedAutonomousCourse;
  @attr('number') maxLevel;
  @attr() cappedTubes;

  @hasMany('badge', { async: true, inverse: null }) badges;
  @belongsTo('stage-collection', { async: true, inverse: null }) stageCollection;
  @hasMany('training-summary', { async: true, inverse: null }) trainingSummaries;

  @hasMany('area', { async: true, inverse: null }) areas;

  attachOrganizations = memberAction({
    path: 'attach-organizations',
    type: 'post',
  });

  attachOrganizationsFromExistingTargetProfile = memberAction({
    path: 'copy-organizations',
    type: 'post',
  });

  outdate = memberAction({
    path: 'outdate',
    type: 'put',
    after() {
      this.reload();
    },
  });

  copy = memberAction({
    path: 'copy',
    type: 'post',
  });
}
