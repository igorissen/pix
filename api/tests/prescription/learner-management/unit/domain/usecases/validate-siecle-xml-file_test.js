import {
  AggregateImportError,
  SiecleXmlImportError,
} from '../../../../../../src/prescription/learner-management/domain/errors.js';
import { FileValidated } from '../../../../../../src/prescription/learner-management/domain/events/FileValidated.js';
import { validateSiecleXmlFile } from '../../../../../../src/prescription/learner-management/domain/usecases/validate-siecle-xml-file.js';
import { SiecleParser } from '../../../../../../src/prescription/learner-management/infrastructure/serializers/xml/siecle-parser.js';
import { SiecleFileStreamer } from '../../../../../../src/prescription/learner-management/infrastructure/utils/xml/siecle-file-streamer.js';
import { DomainTransaction } from '../../../../../../src/shared/domain/DomainTransaction.js';
import { catchErr, expect, sinon } from '../../../../../test-helper.js';

describe('Unit | UseCase | import-organization-learners-from-siecle-xml', function () {
  const organizationId = 1234;
  const organizationImportId = 345;
  let parserStub;
  let organizationImportRepositoryStub;
  let organizationRepositoryStub;
  let streamerSymbol;
  let importStorageStub;
  let organizationImportStub;
  let readableSymbol;
  let dataStub;
  let externalIdSymbol;
  let domainTransactionStub;
  let eventBusStub;
  let eventStub;
  let logErrorWithCorrelationIdsStub;

  beforeEach(function () {
    domainTransactionStub = Symbol('domainTransaction');
    sinon.stub(DomainTransaction, 'execute').callsFake((fn) => fn(domainTransactionStub));

    eventStub = Symbol('event');
    sinon.stub(FileValidated, 'create').returns(eventStub);

    eventBusStub = {
      publish: sinon.stub(),
    };
    eventBusStub.publish.withArgs(eventStub, domainTransactionStub).resolves();

    logErrorWithCorrelationIdsStub = sinon.stub();

    organizationImportRepositoryStub = {
      get: sinon.stub(),
      save: sinon.stub(),
    };
    organizationImportStub = {
      id: 1,
      filename: Symbol('filename'),
      encoding: Symbol('encoding'),
      validate: sinon.stub(),
    };
    organizationImportRepositoryStub.get.withArgs(organizationImportId).resolves(organizationImportStub);
    externalIdSymbol = Symbol('externalId');
    organizationRepositoryStub = {
      get: sinon.stub().withArgs(organizationId).returns({ externalId: externalIdSymbol }),
    };

    importStorageStub = {
      deleteFile: sinon.stub(),
      readFile: sinon.stub().withArgs({ filename: organizationImportStub.filename }).resolves(readableSymbol),
    };
    streamerSymbol = Symbol('streamer');
    sinon
      .stub(SiecleFileStreamer, 'create')
      .withArgs(readableSymbol, organizationImportStub.encoding)
      .resolves(streamerSymbol);

    dataStub = [{ id: 1 }];
    parserStub = {
      parse: sinon.stub().resolves(dataStub),
      parseUAJ: sinon.stub().resolves(),
    };
    sinon.stub(SiecleParser, 'create').withArgs(streamerSymbol).returns(parserStub);
  });

  it('should validate the xml file', async function () {
    await validateSiecleXmlFile({
      organizationImportId,
      organizationImportRepository: organizationImportRepositoryStub,
      organizationRepository: organizationRepositoryStub,
      importStorage: importStorageStub,
      eventBus: eventBusStub,
    });
    expect(parserStub.parseUAJ).to.have.been.calledWithExactly(externalIdSymbol);
    expect(parserStub.parse).to.have.been.calledWithExactly();
    expect(organizationImportStub.validate).to.have.been.calledWith({ errors: [] });
    expect(organizationImportRepositoryStub.save).to.have.been.calledWithExactly(organizationImportStub);
  });

  context('error cases', function () {
    it('should save error when there is an error reading file from S3', async function () {
      const s3Error = new Error('s3 error');
      importStorageStub.readFile.rejects(s3Error);
      const error = await catchErr(validateSiecleXmlFile)({
        organizationImportId,
        organizationImportRepository: organizationImportRepositoryStub,
        organizationRepository: organizationRepositoryStub,
        importStorage: importStorageStub,
        eventBus: eventBusStub,
      });
      expect(error).to.eq(s3Error);
      expect(organizationImportStub.validate).to.have.been.calledWith({ errors: [s3Error] });
      expect(importStorageStub.deleteFile).to.have.been.calledWithExactly({
        filename: organizationImportStub.filename,
      });
      expect(organizationImportRepositoryStub.save).to.have.been.calledWithExactly(organizationImportStub);
    });

    it('should save error when there is an error publishing event', async function () {
      const publishError = new Error('publish error');
      eventBusStub.publish.reset();
      eventBusStub.publish.rejects(publishError);

      await catchErr(validateSiecleXmlFile)({
        organizationImportId,
        organizationImportRepository: organizationImportRepositoryStub,
        organizationRepository: organizationRepositoryStub,
        importStorage: importStorageStub,
        eventBus: eventBusStub,
      });
      expect(organizationImportStub.validate).to.have.been.calledWith({ errors: [publishError] });
      expect(importStorageStub.deleteFile).to.have.been.calledWithExactly({
        filename: organizationImportStub.filename,
      });
      expect(organizationImportRepositoryStub.save).to.have.been.calledWithExactly(organizationImportStub);
    });

    it('should call log method if file deletion on s3 fails', async function () {
      const deletionError = new Error('deletion error');
      eventBusStub.publish.reset();
      eventBusStub.publish.rejects();
      importStorageStub.deleteFile.rejects(deletionError);

      await catchErr(validateSiecleXmlFile)({
        organizationImportId,
        organizationImportRepository: organizationImportRepositoryStub,
        organizationRepository: organizationRepositoryStub,
        importStorage: importStorageStub,
        eventBus: eventBusStub,
        logErrorWithCorrelationIds: logErrorWithCorrelationIdsStub,
      });
      expect(logErrorWithCorrelationIdsStub).to.have.been.calledWith(deletionError);
    });

    context('when there is validation errors', function () {
      it('should save parsing errors', async function () {
        const parsingErrors = [new Error('parsing'), new Error('parsing2')];
        parserStub.parse.rejects(new AggregateImportError(parsingErrors));
        const error = await catchErr(validateSiecleXmlFile)({
          organizationImportId,
          organizationImportRepository: organizationImportRepositoryStub,
          organizationRepository: organizationRepositoryStub,
          importStorage: importStorageStub,
          eventBus: eventBusStub,
        });
        expect(importStorageStub.deleteFile).to.have.been.calledWithExactly({
          filename: organizationImportStub.filename,
        });
        expect(error).to.be.an.instanceOf(AggregateImportError);
        expect(organizationImportStub.validate).to.have.been.calledWith({ errors: parsingErrors });
        expect(organizationImportRepositoryStub.save).to.have.been.calledWithExactly(organizationImportStub);
      });

      it('should save empty learner error', async function () {
        parserStub.parse.resolves([]);
        const error = await catchErr(validateSiecleXmlFile)({
          organizationImportId,
          organizationImportRepository: organizationImportRepositoryStub,
          organizationRepository: organizationRepositoryStub,
          importStorage: importStorageStub,
          eventBus: eventBusStub,
        });
        expect(importStorageStub.deleteFile).to.have.been.calledWithExactly({
          filename: organizationImportStub.filename,
        });
        expect(error).to.be.an.instanceOf(SiecleXmlImportError);
        expect(organizationImportStub.validate).to.have.been.calledWith({ errors: [error] });
        expect(organizationImportRepositoryStub.save).to.have.been.calledWithExactly(organizationImportStub);
      });
    });
  });
});
