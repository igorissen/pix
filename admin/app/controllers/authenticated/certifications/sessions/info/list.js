import Controller from '@ember/controller';
import Papa from 'papaparse';
import { inject as service } from '@ember/service';

export default Controller.extend({

  // DI
  sessionInfoService: service(),
  notifications: service('notification-messages'),

  // Properties
  displayConfirm: false,
  displaySessionReport: false,
  confirmMessage: null,
  confirmAction: null,
  showSelectedActions: false,
  selectedCertifications: null,

  init() {
    this._super();
    this._fields = {
      id: 'ID de certification',
      firstName: 'Prenom du candidat',
      lastName: 'Nom du candidat',
      birthdate: 'Date de naissance du candidat',
      birthplace: 'Lieu de naissance du candidat',
      externalId: 'Identifiant Externe',
      status: 'Statut de la certification',
      sessionId: 'ID de session',
      creationDate: 'Date de debut',
      completionDate: 'Date de fin',
      commentForCandidate: 'Commentaire pour le candidat',
      commentForOrganization: 'Commentaire pour l’organisation',
      commentForJury: 'Commentaire pour le jury',
      pixScore: 'Note Pix'
    };
    this.selected = [];
    this.importedCandidates = [];
    this.confirmAction = () => {};
  },

  actions: {

    async importAndLinkCandidatesToTheSessionCertifications(file) {
      const csvAsText = await file.readAsText();
      // XXX We delete the BOM UTF8 at the beginning of the CSV, otherwise the first element is wrongly parsed.
      const csvRawData = csvAsText.toString('utf8').replace(/^\uFEFF/, '');
      const parsedCSVData = Papa.parse(csvRawData, { header: true, skipEmptyLines: true }).data;
      const rowCount = parsedCSVData.length;
      try {
        await this._importCertificationsData(parsedCSVData);
        this.notifications.success(rowCount + ' lignes correctement importées');
      } catch (error) {
        this.notifications.error(error);
      }
    },

    async displayCertificationSessionReportModal(file) {
      try {
        const attendanceSheetCandidates = await this.sessionInfoService.readSessionAttendanceSheet(file);
        this.set('importedCandidates', attendanceSheetCandidates);
        this.set('displaySessionReport', true);
      } catch (error) {
        this.notifications.error(error);
      }
    },

    downloadSessionResultFile() {
      try {
        this.sessionInfoService.downloadSessionExportFile(this.model);
      } catch (error) {
        this.notifications.error(error);
      }
    },

    async onSaveReportData(candidatesData) {
      const certificationData = candidatesData.map((piece) => {
        const certificationItem = {};
        certificationItem[this._fields.id] = piece.certificationId;
        certificationItem[this._fields.firstName] = piece.firstName;
        certificationItem[this._fields.lastName] = piece.lastName;
        certificationItem[this._fields.birthdate] = piece.birthDate;
        certificationItem[this._fields.birthplace] = piece.birthPlace;
        certificationItem[this._fields.externalId] = piece.externalId;
        return certificationItem;
      });
      try {
        await this._importCertificationsData(certificationData);
        this.notifications.success(candidatesData.length + ' lignes correctement importées');
        this.set('displaySessionReport', false);
      } catch (error) {
        this.notifications.error(error);
      }
    },

    downloadJuryFile(attendanceSheetCandidates) {
      try {
        this.sessionInfoService.downloadJuryFile(this.model, attendanceSheetCandidates);
      } catch (error) {
        this.notifications.error(error);
      }
    },

    displayCertificationStatusUpdateConfirmationModal(intention = 'publish') {
      const count = this.selectedCertifications.length;
      if (intention === 'publish') {
        if (count === 1) {
          this.set('confirmMessage', 'Souhaitez-vous publier la certification sélectionnée ?');
        } else {
          this.set('confirmMessage', `Souhaitez-vous publier les ${count} certifications sélectionnées ?`);
        }
        this.set('confirmAction', 'publishSelectedCertifications');
      } else {
        if (count === 1) {
          this.set('confirmMessage', 'Souhaitez-vous dépublier la certification sélectionnée ?');
        } else {
          this.set('confirmMessage', `Souhaitez-vous dépublier les ${count} certifications sélectionnées ?`);
        }
        this.set('confirmAction', 'unpublishSelectedCertifications');
      }
      this.set('displayConfirm', true);
    },

    async publishSelectedCertifications() {
      try {
        await this._updateCertificationsStatus(this.selectedCertifications, true);
        this.set('displayConfirm', false);
      } catch (error) {
        this.notifications.error(error);
      }
    },

    async unpublishSelectedCertifications() {
      try {
        await this._updateCertificationsStatus(this.selectedCertifications, false);
        this.set('displayConfirm', false);
      } catch (error) {
        this.notifications.error(error);
      }
    },

    onCancelConfirm() {
      this.set('displayConfirm', false);
    },

    onListSelectionChange(e) {
      this.set('selectedCertifications', e.selectedItems);
      this.set('showSelectedActions', e.selectedItems.length > 0);
    },

  },

  _importCertificationsData(data) {
    const dataPiece = data.splice(0, 10);
    return this._updateCertifications(dataPiece)
      .then(() => {
        if (data.length > 0) {
          return this._importCertificationsData(data);
        } else {
          return true;
        }
      });
  },

  async _updateCertificationsStatus(certifications, isPublished) {
    const promises = certifications.map((certification) => {
      certification.set('isPublished', isPublished);
      return certification.save({ adapterOptions: { updateMarks: false } });
    });

    const updatedCertifications = await Promise.all(promises);
    const statusLabel = (isPublished ? 'publiée' : 'dépubliée');
    if (updatedCertifications.length === 1) {
      this.notifications.success(`La certification a été correctement ${statusLabel}.`);
    } else {
      this.notifications.success(`Les ${updatedCertifications.length} certifications ont été correctement  ${statusLabel}s.`);
    }
  },

  _updateCertifications(data) {
    const store = this.store;
    const requests = [];
    const newData = {};
    data.forEach((piece) => {
      const id = piece[this._fields.id];
      newData[id] = piece;
      requests.push(store.findRecord('certification', id));
    });

    const csvImportFields = ['firstName', 'lastName', 'birthdate', 'birthplace', 'externalId'];

    return Promise.all(requests)
      .then((certifications) => {
        const updateRequests = [];
        certifications.forEach((certification) => {
          const id = certification.get('id');
          const sessionId = certification.get('sessionId').toString();
          const newDataPiece = newData[id];
          // check that session id is correct
          if (newDataPiece && sessionId === this.model.id) {
            csvImportFields.forEach((key) => {
              const fieldName = this._fields[key];
              let fieldValue = newDataPiece[fieldName];
              if (fieldValue) {
                if (fieldValue.length === 0) {
                  fieldValue = null;
                }
                certification.set(key, fieldValue);
              }
            });
            // check that info has changed
            if (Object.keys(certification.changedAttributes()).length > 0) {
              updateRequests.push(certification.save({ adapterOptions: { updateMarks: false } }));
            }
          }
        });
        return Promise.all(updateRequests);
      })
      .then(() => {
        return true;
      });
  },

});
