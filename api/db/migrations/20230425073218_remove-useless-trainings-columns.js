const TABLE_NAME = 'trainings';
const COLUMN_NAME_PREREQUISITE_THRESHOLD = 'prerequisiteThreshold';
const COLUMN_NAME_GOAL_THRESHOLD = 'goalThreshold';

exports.up = function (knex) {
  return knex.schema.table(TABLE_NAME, function (table) {
    table.dropColumn(COLUMN_NAME_PREREQUISITE_THRESHOLD);
    table.dropColumn(COLUMN_NAME_GOAL_THRESHOLD);
  });
};

exports.down = function (knex) {
  return knex.schema.table(TABLE_NAME, function (table) {
    table.integer(COLUMN_NAME_PREREQUISITE_THRESHOLD).nullable().defaultTo(null);
    table.integer(COLUMN_NAME_GOAL_THRESHOLD).nullable().defaultTo(null);
  });
};