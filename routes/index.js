const dotenv = require("dotenv");

dotenv.config();

const express = require("express");

// const exp = express();
const app = express.Router();

const isAuth = require("../util/is_auth");
const TokenPass = require("../entities/token_pass");
const dbconnect = require("../util/database");
const staffEntity = require("../entities/staff_entity");
const StaffModel = require("../models/staff_model");
const bcrypt = require("bcryptjs");
const genFunct = require("../util/general_function");
const jwt = require("jsonwebtoken");

app.get("/", (req, res, next) => {
  res.send("hello");
});
app.post("/test", (req, res, next) => {
  console.log(req.body);
  res.send("hello");
});
app.get("/payslip/:staffid/:year/:month", isAuth, (req, res, next) => {
  genFunct
    .getPayslip(req.params["staffid"], req.params["year"], req.params["month"])
    .then((result) => {
      res.json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
// to check recruitment date
app.get("/check_recruit_date/:staffid", isAuth, (req, res, next) => {
  genFunct
    .getRecruitDate(req.params["staffid"])
    .then((result) => {
      res.json({
        status: true,
        message: {
          recruitDate: result["recDate"],
          employStatus: result["employStatus"],
        },
      });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/get_approved/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  genFunct
    .getLeaveHistory(staffId)
    .then((result) => {
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/check_leave_status/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  genFunct
    .checkLeaveStatus(staffId)
    .then((result) => {
      if (typeof result === "undefined") {
        res.status(200).json({ status: true, message: { allowed: true } });
      } else {
        res.status(200).json({ status: true, message: { allowed: false } });
      }
    })
    .catch((err) => {
      err.statusCode = 500;
      res.json({ status: false, message: "An error occured" });
      throw err;
    });
});

app.get("/get_pendingHod/:action/:hodId", isAuth, (req, res, next) => {
  const hodId = req.params["hodId"];
  genFunct
    .getLeaveApproved(hodId, req.params["action"])
    .then(async (result) => {
      for (var i = 0; i < result.length; i++) {
        if (req.params["action"].toString() === "approve") {
          if (
            result[i].passlevel1.toString().toUpperCase() === "YES" &&
            result[i].hodid2.toString() != req.staffId
          ) {
            result.splice(i, 1);
          } else {
            const staffName1 = await genFunct.getStaffName(
              result[i]["staffid"]
            );
            result[i].staffName = staffName1;
          }
        } else {
          if (
            result[i].passlevel1decline.toString().toUpperCase() === "YES" &&
            result[i].hodid2decline.toString() != req.staffId
          ) {
            result.splice(i, 1);
          } else {
            const staffName1 = await genFunct.getStaffName(
              result[i]["staffid"]
            );
            result[i].staffName = staffName1;
          }
        }
      }
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
app.get("/get_pendingAdmin/:adminId", isAuth, (req, res, next) => {
  const adminId = req.params["adminId"];
  genFunct
    .getLeaveAdminApproved(adminId)
    .then(async (result) => {
      for (var i = 0; i < result.length; i++) {
        const staffName1 = await genFunct.getStaffName(result[i]["staffid"]);
        result[i].staffName = staffName1;
      }
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
app.post("/reject_leave", isAuth, (req, res, next) => {
  //hod reject leave

  genFunct
    .rejectLeave(
      req.body.leaveId,
      req.body.hODReason,
      req.body.passedFirstLevel || false
    )
    .then(async (result) => {
      console.log(
        "check entriessssss !!!!! - " +
          req.body.hODReason +
          req.body.passedFirstLevel
      );
      if (result.twoLevel) {
        var allHOD = [];

        for (let i = 0; i < result.allHODs.length; i++) {
          let position = await genFunct.getStaffPosition(
            result.allHODs[i]["Position"]
          );

          console.log(position);
          allHOD.push({
            staffid: result.allHODs[i]["staffid"],
            staffSurname: result.allHODs[i]["stafsurname"],
            staffName: result.allHODs[i]["stafirstname"],
            designation: position,
          });
        }
        res.status(200).json({
          status: true,
          message: { allHODs: allHOD, hasSecondLevel: true },
        });
      } else {
        const staffName1 = await genFunct.getStaffName(
          result["leaveDetails"][0]["staffid"]
        );
        const hODName1 = await genFunct.getStaffName(
          result["leaveDetails"][0]["hodid"]
        );

        let reasonForReject;
        if (req.body.hODReason === null || req.body.hODReason === "") {
          reasonForReject = "No Reason specified";
        } else {
          reasonForReject = req.body.hODReason;
        }

        const mailMessage1 = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly note that ${hODName1} has declined the leave application of ${staffName1} with the reason: <p>${reasonForReject}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}. <br/>Thank you.`;
        const mailMessage2 = `<p>Dear ${staffName1},</p> Kindly note that ${hODName1} has declined the leave application of ${staffName1} with the reason: <p>${reasonForReject}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}.`;
        const mailMessage3 = `<p>Dear ${hODName1},</p> Kindly note that you declined the leave application of ${staffName1} with the reason: <p>${reasonForReject}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}.`;
        const mailHeader = "HOD Leave Rejection";
        //to admin
        genFunct.sendmail(
          result["admin"][0]["email"],
          mailMessage1,
          mailHeader
        );
        // to staff
        genFunct.sendmail(
          await genFunct.getStaffEmail(result["leaveDetails"][0]["staffid"]),
          mailMessage2,
          mailHeader
        );
        //to HOD
        genFunct.sendmail(
          await genFunct.getStaffEmail(result["leaveDetails"][0]["hodid"]),
          mailMessage3,
          mailHeader
        );
        res.status(200).json({
          status: true,
          message: { success: "success", hasSecondLevel: false },
        });
      }
    })
    .catch((err) => {
      err.statusCode = 500;
      res.status(500).json({ status: false, message: "error" });
      //throw err;
    });
});
app.post("/reject_leaveold", isAuth, (req, res, next) => {
  //hod reject leave
  genFunct
    .rejectLeave(req.body.leaveId, req.body.hODReason)
    .then(async (result) => {
      const staffName1 = await genFunct.getStaffName(
        result["leaveDetails"][0]["staffid"]
      );
      const hODName1 = await genFunct.getStaffName(
        result["leaveDetails"][0]["hodid"]
      );

      let reasonForReject;
      if (req.body.hODReason === null || req.body.hODReason === "") {
        reasonForReject = "No Reason specified";
      } else {
        reasonForReject = req.body.hODReason;
      }

      const mailMessage1 = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly note that ${hODName1} has declined the leave application of ${staffName1} with the reason: <p>${reasonForReject}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}. <br/>Thank you.`;
      const mailMessage2 = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly note that ${hODName1} has declined your leave application of ${staffName1} with the reason: <p>${reasonForReject}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}.`;
      const mailMessage3 = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly note that you declined the leave application of ${staffName1} with the reason: <p>${reasonForReject}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}.`;
      const mailHeader = "HOD Leave Rejection";
      //to admin
      genFunct.sendmail(result["admin"][0]["email"], mailMessage1, mailHeader);
      // to staff
      genFunct.sendmail(
        await genFunct.getStaffEmail(req.staffId),
        mailMessage2,
        mailHeader
      );
      //to HOD
      genFunct.sendmail(
        await genFunct.getStaffEmail(result["leaveDetails"][0]["hodid"]),
        mailMessage3,
        mailHeader
      );
      res.status(200).json({ status: true, message: "success" });
    })
    .catch((err) => {
      err.statusCode = 500;
      res.status(500).json({ status: false, message: "error" });
      //throw err;
    });
});

app.post("/pass_to_second_level", isAuth, (req, res, next) => {
  console.log("pass_to_second_level endpoint - " + req.body.reason1);
  genFunct
    .sendToSecondLevel(
      req.body.leaveId,
      req.body.secondLevel,
      req.body.reason1,
      req.body.action
    )
    .then((result) => {
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      res.status(200).json({ status: false, message: "An error occured" });
    });
});
app.post("/pass_to_second_levelresume", isAuth, (req, res, next) => {
  genFunct
    .sendToSecondLevelResume(req.body.leaveId, req.body.secondLevel)
    .then((result) => {
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      res.status(200).json({ status: false, message: "An error occured" });
    });
});

app.post("/approve_leave", isAuth, (req, res, next) => {
  //hod approve leavve save
  genFunct
    .approveLeave(req.body.leaveId)
    .then(async (result) => {
      if (result.twolevel) {
        var allHOD = [];

        for (let i = 0; i < result.allHODs.length; i++) {
          let position = await genFunct.getStaffPosition(
            result.allHODs[i]["Position"]
          );

          console.log(position);

          allHOD.push({
            staffid: result.allHODs[i]["staffid"],
            staffSurname: result.allHODs[i]["stafsurname"],
            staffName: result.allHODs[i]["stafirstname"],
            designation: position,
          });
        }

        res
          .status(200)
          .json({ status: true, message: { allHODs: allHOD, twoLevel: true } });
      } else {
        const staffName1 = await genFunct.getStaffName(
          result["leaveDetails"][0]["staffid"]
        );
        const mailMessage = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly approve leave application of ${staffName1} for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}. <br/>Please, approve leave via the Evans portal app or click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.<br>Thank you.`;
        genFunct.sendmail(
          result["admin"][0]["email"],
          mailMessage,
          "HOD Leave Approval"
        );
        res.status(200).json({
          status: true,
          message: { success: "success", twoLevel: false },
        });
      }
    })
    .catch((err) => {
      err.statusCode = 500;
      throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
//final from hod for resumption of duty
app.post("/save_confirmHOD", isAuth, (req, res, next) => {
  //hod approve leavve save
  genFunct
    .finalConfirmResume(req.body.leaveId)
    .then(async (result) => {
      if (
        result.twoLevel &&
        result.leaveDetails[0]["passlevel1resume"].toString() !== "YES"
      ) {
        var allHOD = [];

        for (let i = 0; i < result.allHODs.length; i++) {
          let position = await genFunct.getStaffPosition(
            result.allHODs[i]["Position"]
          );

          console.log(position);

          allHOD.push({
            staffid: result.allHODs[i]["staffid"],
            staffSurname: result.allHODs[i]["stafsurname"],
            staffName: result.allHODs[i]["stafirstname"],
            designation: position,
          });
        }

        res.status(200).json({
          status: true,
          message: { allHODs: allHOD, twoLevel: true },
        });
      } else {
        console.log("!!!!!!!!!!" + result.leaveDetails);
        const staffName1 = await genFunct.getStaffName(
          result["leaveDetails"][0]["staffid"]
        );
        const mailMessage = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly note the resumption of ${staffName1} on ${result["leaveDetails"][0]["returndatestaff"]}. <br/>Thank you.`;
        genFunct.sendmail(
          result["admin"][0]["email"],
          mailMessage,
          "HOD Submit Resumption of Duty Form"
        );

        res.status(200).json({
          status: true,
          message: { success: "success", twoLevel: false },
        });
      }
    })
    .catch((err) => {
      err.statusCode = 500;
      throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.post("/approve_Leave_Admin", isAuth, (req, res, next) => {
  genFunct
    .approveLeaveAdmin(req.body.leaveId, req.body.expectedReturn)
    .then(async (result) => {
      const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      let totalUsed = await genFunct.get_leave_used(
        result[0]["staffid"],
        result[0]["leavetype"],
        new Date().getFullYear()
      );
      let entitledLeave = await genFunct.get_staffEntitled_leave(
        result[0]["staffid"],
        result[0]["leavetype"]
      );
      let remainingLeave = entitledLeave - totalUsed;

      let hodEmail;
      let hodEmail2;
      let staffEmail;

      if (result[0]["hodid"] != undefined && result[0]["hodid"] != "") {
        hodEmail = await genFunct.getStaffEmail(result[0]["hodid"]);
      }
      if (result[0]["hodid2"] != undefined && result[0]["hodid2"] != "") {
        hodEmail2 = await genFunct.getStaffEmail(result[0]["hodid2"]);
      }
      if (result[0]["staffid"] != undefined && result[0]["staffid"] != "") {
        staffEmail = await genFunct.getStaffEmail(result[0]["staffid"]);
      }

      const staffName = await genFunct.getStaffName(result[0]["staffid"]);

      const resumeDate = new Date(result[0]["returndateA"]);
      const startDate = new Date(result[0]["startDate"]);
      const endDate = new Date(result[0]["endDate"]);
      const startMonth = months[startDate.getUTCMonth()];
      const startYear = startDate.getFullYear();
      const endMonth = months[endDate.getUTCMonth()];
      const endYear = endDate.getFullYear();
      const endDay = endDate.getUTCDate();
      //defining the resumption date
      const resumeMonth = months[resumeDate.getUTCMonth()];
      const resumeYear = resumeDate.getFullYear();
      const resumeDay = resumeDate.getUTCDate();

      const startDay = startDate.getUTCDate();

      let startDayString;
      let endDayString;

      const mailMessage = `Dear ${staffName},<br/> <p>Approval is hereby given to you to proceed on ${result[0]["daysno"]} days(s) leave on ${startMonth} ${startDay}, ${startYear} to ${endMonth} ${endDay}, ${endYear}. You will resume your normal duties on ${resumeMonth} ${resumeDay}, ${resumeYear}.</p> <p>The balance of your leave now stands at ${remainingLeave} day(s) and  5 days end of year break.</p> <p>You are to ensure that the resumption of duty form is completed on your portal immediately you resume.</p><br/> OA`;
      // this attachment not yet working

      const subject = `Re: Request For ${result[0]["daysno"]} Day(s) Leave`;
      if (hodEmail != undefined) {
        genFunct.sendmail(hodEmail, mailMessage, subject);
      }
      if (hodEmail2 != undefined) {
        genFunct.sendmail(hodEmail2, mailMessage, subject);
      }
      if (staffEmail != undefined) {
        genFunct.sendmail(staffEmail, mailMessage, subject);
      }
      res.status(200).json({ status: true, message: "success" });
    })
    .catch((err) => {
      // err.statusCode = 500;
      throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
app.get("/get_return_leave/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  genFunct
    .get_return_leave(staffId)
    .then((result) => {
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
//staff pending return from leave
app.get("/get_staff_return_leave/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  genFunct
    .getLeaveReturn(staffId)
    .then((result) => {
      // console.log(result);
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
//
//staff pending return from leave
app.get("/confirm_resumeHod/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  genFunct
    .getPendingResume(staffId, req.staffId)
    .then(async (result) => {
      for (var i = 0; i < result.length; i++) {
        const staffName1 = await genFunct.getStaffName(result[i]["staffid"]);
        result[i].staffName = staffName1;
      }
      // console.log(result);
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

//return from leave to update database with resumption date and status
app.post("/return_from_leave", isAuth, async (req, res, next) => {
  //hod approve leavve save
  const staffId = req.body.staffId;
  const staffName = await genFunct.getStaffName(staffId);
  const hodId = req.body.hodId;
  const leaveId = req.body.leaveId;

  genFunct
    .returnFromLeave(staffId, hodId, leaveId)
    .then((result) => {
      const mailMessage = `<p>Dear ${result[0]["stafsurname"]} ${result[0]["stafirstname"]},</p> Kindly approve resumption of duty of ${staffName} on ${result[0]["returndatestaff"]}. <br/>Please, approve leave via the Evans portal app or click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.<br>Thank you.`;
      genFunct.sendmail(result[0]["email"], mailMessage, "Resumption of duty");
      res.json({ status: true, message: "success" });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/get_approve_leave/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  console.log(staffId);
  genFunct
    .get_return_leave(req.params["staffid"])
    .then((result) => {
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
app.post("/submit_leave_application", isAuth, (req, res, next) => {
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  const staffId = req.body.staffId;
  const staffName = req.body.staffName;
  const leaveBonusApplied = req.body.leaveBonusApplied;
  const hodId = req.body.hodId;
  const daysAplliedFor = req.body.days;
  const ltype = req.body.lType;

  genFunct
    .submitLeaveApp(
      startDate,
      endDate,
      daysAplliedFor,
      staffId,
      leaveBonusApplied,
      hodId,
      ltype
    )
    .then((result) => {
      if (result === true) {
        res.json({
          status: false,
          existingLeave: true,
          message: "You have already applied for this date range",
        });
      } else {
        const mailMessage = `<p>Dear ${result[0]["stafsurname"]} ${result[0]["stafirstname"]},</p> Kindly approve leave application of ${staffName} for ${daysAplliedFor} day(s) between ${startDate} to ${endDate}. <br/>Please, approve leave via the Evans portal app or click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.<br>Thank you.`;
        genFunct.sendmail(result[0]["email"], mailMessage, "Leave Application");
        res.json({ status: true, message: "success" });
      }
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/all_hod", isAuth, (req, res, next) => {
  genFunct
    .getAllHod()
    .then(async (result) => {
      var allHOD = [];

      for (let i = 0; i < result.length; i++) {
        let position = await genFunct.getStaffPosition(result[i]["Position"]);

        console.log(position);

        allHOD.push({
          staffid: result[i]["staffid"],
          staffSurname: result[i]["stafsurname"],
          staffName: result[i]["stafirstname"],
          designation: position,
        });
      }
      console.log(allHOD);

      res.json({ status: true, message: allHOD });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/entitled_leave/:staffid/:ltype", isAuth, async (req, res, next) => {
  console.log(req.params);
  genFunct
    .get_staffEntitled_leave(req.params["staffid"], req.params["ltype"])
    .then((result) => {
      res.json({ status: true, message: { entitledLeave: result } });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/used_leave/:staffid/:year/:ltype", isAuth, async (req, res, next) => {
  genFunct
    .get_leave_used(
      req.params["staffid"],
      req.params["ltype"],
      req.params["year"]
    )
    .then((result) => {
      res.json({ status: true, message: { usedLeave: result } });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/leave_bonus/:staffid/:year", isAuth, async (req, res, next) => {
  console.log(req.params);
  genFunct
    .leaveBonusS(req.params["staffid"], req.params["year"])
    .then((result) => {
      res.json({ status: true, message: { leaveBonus: result } });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.get("/staff_details/:staffId", isAuth, (req, res, next) => {
  console.log(req.params["staffId"]);
  genFunct
    .getStaffDetails(req.params["staffId"])
    .then(async (result) => {
      let resultMap = result[0];
      console.log("staff details - " + typeof resultMap);
      resultMap.passme = undefined;
      resultMap.AcNo = undefined;
      resultMap.staffid = undefined;
      resultMap.Position = undefined;
      resultMap.pension = undefined;
      resultMap.STermination = undefined;
      resultMap.Education = undefined;
      resultMap.PEducation = undefined;
      resultMap.BankName = undefined;
      resultMap.pensiontype = undefined;
      resultMap.sortCode = undefined;
      resultMap.StaffType = undefined;
      resultMap.ContrEndDate = undefined;
      resultMap.Designation = undefined;
      resultMap.hod = undefined;
      resultMap.employstatus = undefined;
      resultMap.sigFlag = undefined;
      resultMap.twolevel = undefined;
      resultMap.areaoffice = await genFunct.getAreaOfficeName(
        resultMap.areaoffice
      );
      resultMap.deptid = await genFunct.getDepartmentName(resultMap.deptid);
      resultMap.Gstep = await genFunct.getStaffStepName(resultMap.Gstep);
      resultMap.SGrade = await genFunct.getStaffGradeName(resultMap.SGrade);
      // resultMap.PicFlag = undefined;

      res.json({ status: true, message: resultMap });
    })
    .catch((err) => {
      // err.statusCode = 500;
      throw err;
      res.json({ status: false, message: "An error occured" });
    });
});
app.get("/staff_pic/:staffId", (req, res, next) => {
  console.log(req.params["staffId"]);
  genFunct
    .getStaffDetails(req.params["staffId"])
    .then((result) => {
      let resultMap = result[0];
      console.log("staff details - " + typeof resultMap);
      res.json({ status: true, message: resultMap.PicFlag });
    })
    .catch((err) => {
      // err.statusCode = 500;
      throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

//login endpoint
app.post("/staff_login", (req, res, next) => {
  staffEntity
    .findOne({
      where: {
        stafsurname: req.body["userNam"],
        passme: req.body["passwordMe"],
      },
    })
    .then((result) => {
      // console.log(result.dataValues);
      if (result != null) {
        req.staffid = result.dataValues["staffid"];
        req.stafsurname = result.dataValues["stafsurname"];
        req.stafirstname = result.dataValues["stafirstname"];

        const token1 = jwt.sign(
          { staffid: result.dataValues["staffid"] },
          process.env.tokenSecret,
          { expiresIn: "900000000" }
        );

        const tokenPass = new TokenPass({
          token: token1,
          staffId: result.dataValues["staffid"],
          signedAt: new Date(),
        });

        let responseToken;

        tokenPass
          .save()
          .then((result) => {
            responseToken = result.token;
            return genFunct.checkAdminHod(req.staffid);
          })
          .then((result) => {
            const isAdmin = result["admin"];
            const isHod = result["hod"];
            console.log(result.token);
            var staffModel = new StaffModel(
              req.staffid,
              req.stafsurname,
              req.stafirstname,
              isHod,
              isAdmin
            );
            genFunct
              .checkPosition(req.staffid)
              .then((result1) => {
                res.status(200).json({
                  message: {
                    staffDetails: staffModel,
                    designation: result1,
                  },
                  status: true,
                  token: responseToken,
                });
              })
              .catch((err) => {
                // err.statusCode = 500;
                // throw err;
                res.json({ status: false, message: "An error occured" });
              });
          })
          .catch((err) => {
            // err.statusCode = 500;
            // throw err;
            res.json({ status: false, message: "An error occured" });
          });
      } else {
        res.status(404).json({ message: "Incorrect details!", status: false });
      }
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.post("/staff_logout", isAuth, (req, res, next) => {
  if (req.header && req.get("Authorization")) {
    TokenPass.destroy({ where: { token: req.token } })
      .then((result) => {
        if (result) {
          res
            .status(200)
            .json({ message: "Signed out successfully.", status: true });
        } else {
          res
            .status(401)
            .json({ message: "Error! Incorrect token.", status: false });
        }
      })
      .catch((err) => {
        // err.statusCode = 500;
        // throw err;
        res.json({ status: false, message: "An error occured" });
      });
  } else {
    const error = new Error("Error! No Authorization header set.");
    // error.statusCode = 500;
    // throw error;
    res.json({ status: false, message: "An error occured" });
  }
});

app.post("/get_reset_password_code", async (req, res, next) => {
  console.log(req.body.staffMail);
  //send mail to staff
  genFunct.sendOTPToStaff(req.body.staffMail).then((responseText) => {
    res.json({ status: true, message: responseText });
  });
});

//authenticate password reset code
app.post("/check_code", (req, res, next) => {
  console.log(req.body.code);
  console.log(req.body.email);

  genFunct.checkCode(req.body.code, req.body.email).then((result) => {
    let messageRes;
    if (result) {
      messageRes = "Correct";
    } else {
      messageRes = "Incorrect";
    }

    console.log(messageRes);

    res.json({ status: true, message: messageRes });
  });
});

app.post("/reset_password", (req, res, next) => {
  genFunct
    .changePassword(req.body.newPassword, req.body.email)
    .then((result) => {
      res.json({ status: true, message: result });
    });
});

// Check for new update-app version
app.get("/newer_version/:current", (req, res, next) => {
  const updateString = "An update is available! Go to ";
  const urlToApp = "https://evanspublishersltdportal.com/evansportal/index.php";
  const currentVersion = "1.0.6";

  if (req.params.current === currentVersion) {
    res.json({ status: false, message: "no update", url: "" });
  } else {
    res.json({ status: true, message: updateString, url: urlToApp });
  }
});

//cancel leave by staff
app.get("/get_pending_approval/:staffid", isAuth, (req, res, next) => {
  const staffId = req.params["staffid"];
  console.log("staff id - " + staffId);
  genFunct
    .getPendingLeaveHistory(staffId)
    .then((result) => {
      res.status(200).json({ status: true, message: result });
    })
    .catch((err) => {
      // err.statusCode = 500;
      // throw err;
      res.json({ status: false, message: "An error occured" });
    });
});

app.post("/cancel_leave", isAuth, (req, res, next) => {
  //hod reject leave
  genFunct
    .cancelLeave(req.body.leaveId, req.body.reason)
    .then(async (result) => {
      console.log(
        "check entriessssss !!!!! - " + req.body.reason + req.body.leaveId
      );
      const staffName1 = await genFunct.getStaffName(
        result["leaveDetails"][0]["staffid"]
      );
      const hODName1 = await genFunct.getStaffName(
        result["leaveDetails"][0]["hodid"]
      );

      let reasonForCancel;
      if (req.body.reason === null || req.body.reason === "") {
        reasonForCancel = "No Reason specified";
      } else {
        reasonForCancel = req.body.reason;
      }

      const mailMessage1 = `<p>Dear ${result["admin"][0]["stafsurname"]} ${result["admin"][0]["stafirstname"]},</p> Kindly note that ${staffName1} has canceled their leave application with the reason: <p>${reasonForCancel}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}. <br/>Thank you.`;
      const mailMessage2 = `<p>Dear ${staffName1},</p> Kindly note that you have canceled your leave application of with the reason: <p>${reasonForCancel}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}.`;
      const mailMessage3 = `<p>Dear ${hODName1},</p> Kindly note that the leave application of ${staffName1} has been canceled with the reason: <p>${reasonForCancel}.</p>The leave application was for ${result["leaveDetails"][0]["daysno"]} day(s) between ${result["leaveDetails"][0]["startDate"]} to ${result["leaveDetails"][0]["endDate"]}.`;
      const mailHeader = "Leave Request Canceled";
      //to admin
      genFunct.sendmail(result["admin"][0]["email"], mailMessage1, mailHeader);
      // to staff
      genFunct.sendmail(
        await genFunct.getStaffEmail(result["leaveDetails"][0]["staffid"]),
        mailMessage2,
        mailHeader
      );
      //to HOD
      genFunct.sendmail(
        await genFunct.getStaffEmail(result["leaveDetails"][0]["hodid"]),
        mailMessage3,
        mailHeader
      );
      res.status(200).json({
        status: true,
        message: { success: "success", hasSecondLevel: false },
      });
    })
    .catch((err) => {
      err.statusCode = 500;
      res.status(500).json({ status: false, message: "error" });
      //throw err;
    });
});
//upload news
app.get("/news", (req, res, next) => {
  genFunct
    .getNews()
    .then((news) => {
      res.json({ status: true, message: news });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});

app.get("/birthdays", (req, res, next) => {
  genFunct
    .getBirthdays()
    .then(async (birthdays) => {
      for (let i = 0; i < birthdays.length; i++) {
        let position = await genFunct.getStaffPosition(
          birthdays[i]["Position"]
        );
        birthdays[i]["position"] = position;
      }
      res.json({ status: true, message: birthdays });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});
app.get("/birthdaystoday", (req, res, next) => {
  genFunct
    .getBirthdaystoday()
    .then(async (birthdays) => {
      for (let i = 0; i < birthdays.length; i++) {
        let position = await genFunct.getStaffPosition(
          birthdays[i]["Position"]
        );
        birthdays[i]["position"] = position;
      }
      res.json({ status: true, message: birthdays });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});
//view feedback
app.get("/viewfeedbackolderror", (req, res, next) => {
  genFunct
    .getviewfeedback()
    .then(async (feedback) => {
      for (let i = 0; i < feedback.length; i++) {
        let position = await genFunct.getStaffName(feedback[i]["Position"]);
        feedback[i]["position"] = position;
      }
      res.json({ status: true, message: feedback });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});

app.get("/viewfeedback", (req, res, next) => {
  genFunct
    .getviewfeedback()
    .then(async (feedback1) => {
      for (let i = 0; i < feedback1.length; i++) {
        const staffName1 = await genFunct.getStaffName(feedback1[i]["staffid"]);
        feedback1[i].staffname = staffName1;
      }
      res.json({ status: true, message: feedback1 });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});

//birthday wishes
app.post("/save_wishes", (req, res, next) => {
  genFunct
    .saveBirthdayswish(req.body.wisher, req.body.wishes, req.body.staffId)
    .then((birthdays) => {
      res.json({ status: true, message: "success" });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});

app.get("/birthday_wishes/:staffId", (req, res, next) => {
  genFunct
    .getBirthdayswish(req.params.staffId)
    .then(async (wishes) => {
      for (let i = 0; i < wishes.length; i++) {
        const staffName1 = await genFunct.getStaffName(wishes[i]["wisherid"]);
        wishes[i]["wisherName"] = staffName1;
      }
      res.json({ status: true, message: wishes });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});

app.post("/feedback", (req, res, next) => {
  genFunct
    .saveFeedback(req.body.feedback, req.body.staffId)
    .then((news) => {
      res.json({ status: true, message: news });
    })
    .catch((err) => {
      res.json({ status: false, message: "An error occured!" });
    });
});
module.exports = app;
