import Model, { attr, belongsTo } from '@ember-data/model';

export default class TriggerTube extends Model {
  @attr('number') level;

  @belongsTo('tube', { async: false, inverse: null }) tube;
}
