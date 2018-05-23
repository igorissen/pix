const _ = require('lodash');

class Challenge {

  constructor(id, status, skills, timer) {
    this.id = id;
    this.status = status;
    this.skills = skills;
    this.timer = timer;

    if (this.skills.length === 0) {
      throw new Error('sale bolosse');
    }
  }

  get isActive() {
    const unactiveChallengeStatus = ['validé', 'validé sans test', 'pré-validé'];
    return unactiveChallengeStatus.includes(this.status);
  }

  get hardestSkill() {
    return this.skills.reduce((s1, s2) => (s1.difficulty > s2.difficulty) ? s1 : s2);
  }

  skillsFullyIncludedIn(assessedSkills) {
    return _(this.skills).difference(assessedSkills).size() > 0;
  }
}

module.exports = Challenge;
