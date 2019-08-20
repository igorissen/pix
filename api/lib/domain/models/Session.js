class Session {

  constructor({
    id,
    // attributes
    accessCode,
    address,
    certificationCenter,
    certificationCenterId,
    date,
    description,
    examiner,
    room,
    time,
    // includes
    certifications,
    certificationCandidates,
    // references
  } = {}) {
    this.id = id;
    // attributes
    this.accessCode = accessCode;
    this.address = address;
    this.certificationCenter = certificationCenter;
    this.certificationCenterId = certificationCenterId;
    this.date = date;
    this.description = description;
    this.examiner = examiner;
    this.room = room;
    this.time = time;
    // includes
    this.certifications = certifications;
    this.certificationCandidates = certificationCandidates;
    // references
  }
}

module.exports = Session;
