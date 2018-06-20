const randomString = require('randomstring');

function generate({ campaignRepository }) {
  const letters = randomString.generate({ length: 6, charset: 'alphabetic', capitalization: 'uppercase' });
  const numbers = randomString.generate({ length: 3, charset: 'numeric' });

  const generatedCampaignCode = letters.concat(numbers);

  return campaignRepository.isCodeAvailable(generatedCampaignCode)
    .then((isCodeAvailable) => {
      if (isCodeAvailable) {
        return Promise.resolve(generatedCampaignCode);
      }
      return generate({ campaignRepository });
    });
}

module.exports = {
  generate,
}
