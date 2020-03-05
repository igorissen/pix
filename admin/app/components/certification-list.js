import Component from '@glimmer/component';

export default class CertificationList extends Component {

  columns = [
    {
      component: 'certification-list-checkbox',
      useFilter: false,
      mayBeHidden: false,
      componentForSortCell: 'certification-list-select-all'
    },
    {
      propertyName: 'id',
      title: 'Id',
      routeName: 'authenticated.certifications.single.info',
      sortPrecedence: 1
    },
    {
      propertyName: 'firstName',
      title: 'Prénom'
    },
    {
      propertyName: 'lastName',
      title: 'Nom'
    },
    {
      propertyName: 'status',
      title: 'Statut'
    },
    {
      propertyName: 'pixScore',
      title: 'Score'
    },
    {
      propertyName: 'creationDate',
      title: 'Début'
    },
    {
      propertyName: 'completionDate',
      title: 'Fin'
    },
    {
      component: 'certification-info-published',
      useFilter: false,
      mayBeHidden: false,
      title: 'Publiée'
    },
  ];
}
