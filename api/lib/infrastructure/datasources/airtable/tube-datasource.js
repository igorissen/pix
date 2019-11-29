const _ = require('lodash');
const airtable = require('../../airtable');
const AirtableResourceNotFound = require('./AirtableResourceNotFound');

const TABLE_NAME = 'Tubes';

const USED_FIELDS = [
  'Nom',
  'Titre',
  'Description',
  'Titre pratique',
  'Description pratique',
];

function fromAirTableObject(airtableRecord) {
  return {
    id: airtableRecord.getId(),
    name: airtableRecord.get('Nom'),
    title: airtableRecord.get('Titre'),
    description: airtableRecord.get('Description'),
    practicalTitle: airtableRecord.get('Titre pratique'),
    practicalDescription: airtableRecord.get('Description pratique'),
  };
}

function _doQuery(filter) {
  return airtable.findRecords(TABLE_NAME, USED_FIELDS)
    .then((rawTubes) => {
      return _(rawTubes)
        .filter(filter)
        .map(fromAirTableObject)
        .value();
    });
}

module.exports = {

  tableName: TABLE_NAME,

  usedFields: USED_FIELDS,

  fromAirTableObject,

  findByNames(tubeNames) {
    return _doQuery((rawTube) => _.includes(tubeNames, rawTube.fields['Nom']));
  },

  get(id) {
    return airtable.getRecord(TABLE_NAME, id)
      .then(fromAirTableObject)
      .catch((err) => {
        if (err.error === 'NOT_FOUND') {
          throw new AirtableResourceNotFound();
        }
        throw err;
      });
  },

  list() {
    return _doQuery({});
  },
};
