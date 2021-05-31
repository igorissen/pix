const { expect, knex, domainBuilder, databaseBuilder, catchErr } = require('../../../test-helper');
const OrganizationTag = require('../../../../lib/domain/models/OrganizationTag');
const { AlreadyExistingEntityError, OrganizationTagNotFound } = require('../../../../lib/domain/errors');
const organizationTagRepository = require('../../../../lib/infrastructure/repositories/organization-tag-repository');
const omit = require('lodash/omit');
const BookshelfOrganizationTag = require('../../../../lib/infrastructure/orm-models/OrganizationTag');

describe('Integration | Repository | OrganizationTagRepository', () => {

  describe('#create', () => {

    afterEach(async () => {
      await knex('organization-tags').delete();
    });

    it('should create an OrganizationTag', async () => {
      // given
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      const tagId = databaseBuilder.factory.buildTag().id;
      await databaseBuilder.commit();
      const organizationTag = domainBuilder.buildOrganizationTag({ organizationId, tagId });

      // when
      const createdOrganizationTag = await organizationTagRepository.create(organizationTag);

      // then
      expect(createdOrganizationTag).to.be.instanceOf(OrganizationTag);
      expect(omit(createdOrganizationTag, 'id')).to.deep.equal(omit(organizationTag, 'id'));
    });

    context('when an organization tag already exist', () => {

      it('should throw an AlreadyExistingEntityError', async () => {
        // given
        const existingOrganizationTag = databaseBuilder.factory.buildOrganizationTag();
        await databaseBuilder.commit();

        // when
        const error = await catchErr(organizationTagRepository.create)({
          organizationId: existingOrganizationTag.organizationId,
          tagId: existingOrganizationTag.tagId,
        });

        // then
        expect(error).to.be.an.instanceof(AlreadyExistingEntityError);
      });
    });
  });

  describe('#delete', () => {

    it('should delete an organization tag', async () => {
      // given
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      const tagId = databaseBuilder.factory.buildTag({ name: 'SCO' }).id;
      const otherTagId = databaseBuilder.factory.buildTag({ name: 'AGRICULTURE' }).id;
      const organizationTagToBeDeleteId = databaseBuilder.factory.buildOrganizationTag({
        organizationId,
        tagId,
      }).id;
      databaseBuilder.factory.buildOrganizationTag({
        organizationId,
        tagId: otherTagId,
      });
      await databaseBuilder.commit();

      // when
      await organizationTagRepository.delete({ organizationTagId: organizationTagToBeDeleteId });

      // then
      const nbOrganizationTagAfterDeletion = await BookshelfOrganizationTag.count();
      expect(nbOrganizationTagAfterDeletion).to.equal(1);
    });

    context('when organization tag does not exist', () => {

      it('should throw an OrganizationTagNotFound', async () => {
        // given
        const organizationId = databaseBuilder.factory.buildOrganization().id;
        const tagId = databaseBuilder.factory.buildTag({ name: 'SCO' }).id;
        const organizationTagId = databaseBuilder.factory.buildOrganizationTag({
          organizationId,
          tagId,
        }).id;
        await databaseBuilder.commit();

        // when
        const inexistingOranizationTagId = organizationTagId + 1;
        const error = await catchErr(organizationTagRepository.delete)({ organizationTagId: inexistingOranizationTagId });

        // then
        expect(error).to.be.an.instanceof(OrganizationTagNotFound);
        expect(error.message).to.be.equal('An error occurred while deleting the organization tag');
      });
    });
  });

  describe('#isExistingByOrganizationIdAndTagId', () => {

    it('should return true if organization tag exists', async () => {
      // given
      const existingOrganizationTag = databaseBuilder.factory.buildOrganizationTag();
      await databaseBuilder.commit();

      // when
      const isExisting = await organizationTagRepository.isExistingByOrganizationIdAndTagId({
        organizationId: existingOrganizationTag.organizationId,
        tagId: existingOrganizationTag.tagId,
      });

      // then
      expect(isExisting).to.be.true;
    });

    it('should return false if organization tag does not exist', async () => {
      // given
      const notExistingId = 1234;

      // when
      const isExisting = await organizationTagRepository.isExistingByOrganizationIdAndTagId({
        organizationId: notExistingId,
        tagId: notExistingId,
      });

      // then
      expect(isExisting).to.be.false;
    });
  });

  describe('#batchCreate', () => {

    afterEach(async () => {
      await knex('organization-tags').delete();
    });

    it('should add rows in the table "organizations-tags"', async () => {
      // given
      const organizationId1 = databaseBuilder.factory.buildOrganization().id;
      const organizationId2 = databaseBuilder.factory.buildOrganization().id;

      const tagId1 = databaseBuilder.factory.buildTag({ name: 'tag1' }).id;
      const tagId2 = databaseBuilder.factory.buildTag({ name: 'tag2' }).id;

      await databaseBuilder.commit();

      const organizationTag1 = domainBuilder.buildOrganizationTag({ organizationId: organizationId1, tagId: tagId1 });
      const organizationTag2 = domainBuilder.buildOrganizationTag({ organizationId: organizationId2, tagId: tagId2 });
      organizationTag1.id = undefined;
      organizationTag2.id = undefined;

      // when
      await organizationTagRepository.batchCreate([organizationTag1, organizationTag2]);

      // then
      const foundOrganizations = await knex('organization-tags').select();
      expect(foundOrganizations.length).to.equal(2);
    });
  });
});
