import { BadgeToAttach } from '../../../../src/certification/complementary-certification/domain/models/BadgeToAttach.js';

const buildBadgeToAttach = function ({
  level = 1,
  complementaryCertificationId,
  badgeId,
  createdAt = new Date('2020-01-01'),
  imageUrl = 'http://badge-image-url.fr',
  label = 'Label par defaut',
  certificateMessage = null,
  temporaryCertificateMessage = null,
  stickerUrl = 'http://stiker-url.fr',
  createdBy = null,
}) {
  return new BadgeToAttach({
    level,
    complementaryCertificationId,
    badgeId,
    createdAt,
    imageUrl,
    label,
    certificateMessage,
    temporaryCertificateMessage,
    stickerUrl,
    createdBy,
  });
};

export { buildBadgeToAttach };