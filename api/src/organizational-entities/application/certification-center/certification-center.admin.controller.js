import { usecases } from '../../domain/usecases/index.js';
import * as certificationCenterSerializer from '../../infrastructure/serializers/jsonapi/certification-center/certification-center.serializer.js';

const findPaginatedFilteredCertificationCenters = async function (
  request,
  h,
  dependencies = { certificationCenterSerializer },
) {
  const options = request.query;
  const { models: organizations, pagination } = await usecases.findPaginatedFilteredCertificationCenters({
    filter: options.filter,
    page: options.page,
  });

  return dependencies.certificationCenterSerializer.serialize(organizations, pagination);
};

const certificationCenterController = {
  findPaginatedFilteredCertificationCenters,
};

export { certificationCenterController };
