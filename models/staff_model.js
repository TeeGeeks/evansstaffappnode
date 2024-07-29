class StaffModel {
    constructor(staffId, staffName, staffFirstNam,isHod, isAdmin){
        this.staffId = staffId;
        this.staffName = staffName;
        this.staffFirstNam=staffFirstNam;
        this.isHod=isHod;
        this.isAdmin=isAdmin;
    }

    getJson() {
        return {staffid: this.staffId, staffName: this.staffName, staffFirstNam: this.staffFirstNam};
    }
}

module.exports = StaffModel;