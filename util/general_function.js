const connection = require("./mysql_conn");
const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
  pool: true,
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: "evanspubltd@gmail.com",
    pass: "fzavkdrqpbdivcby",
  },
  // authMethod: '',
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

exports.sendmail = function sendNotification(to, message, subject, attachment) {
  let mailOptions = {
    from: '"Evans Brothers Nigeria Publishers Ltd" <evanspubltd@gmail.com>',
    to: to,
    subject: subject,
    html: message,
    attachment: attachment,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

exports.getStaffDetails = (staffId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE staffid='${staffId}'`,
      (err, rows) => {
        if (err === null) {
          resolve(rows);
        }
        // reject(err);
      }
    );
  });
};

exports.get_leave_used = (staffid, ltype, yr) => {
  return new Promise((resolve, reject) => {
    let recTotG = 0;
    let queryrog1 = `SELECT * FROM staffleave WHERE staffid='${staffid}' AND lvyear='${yr}' AND leavetype='${ltype}' AND status!='CANCELLED' AND  status!='REJECTED'`;
    connection.query(queryrog1, function (err, rows) {
      if (rows.length >= 1) {
        rows.forEach(function (rowoel1) {
          let temp = rowoel1["daysno"];
          recTotG += temp;
        });
      } else {
        recTotG = 0;
      }
      resolve(recTotG);
      // return recTotG;
    });
  });
};

exports.leaveBonusS = (staffid, yr) => {
  return new Promise((resolve, reject) => {
    let recTotG = 0;
    let queryrog1B = `SELECT * FROM staffleave WHERE staffid='${staffid}' AND lvyear='${yr}' AND leaveBonus='YES' AND status!='CANCELLED'`;
    connection.query(queryrog1B, function (err, rows) {
      if (rows.length > 0) {
        resolve("YES");
        return "YES";
      } else {
        resolve("NO");
        return "NO";
      }
    });
  });
};

exports.get_staffEntitled_leave = (staffid, lvtype) => {
  return new Promise((resolve, reject) => {
    if (lvtype === "Annual Leave") {
      connection.query(
        `SELECT * FROM staffs WHERE staffid='${staffid}'`,
        function (err, rows) {
          let SGrade = rows[0]["SGrade"];
          connection.query(
            `SELECT * FROM gradeleave WHERE Grade='${SGrade}'`,
            function (err, rows) {
              resolve((rows[0]["noDays"] - 5).toString());
              // return rows[0]["noDays"];
            }
          );
        }
      );
    }
    if (lvtype === "Maternity Leave") {
      resolve("60");
      // return "60";
    }
    if (lvtype === "Sick Leave") {
      resolve("0");
      // return "Nil";
    }
    if (lvtype === "Casual Leave") {
      resolve("5");
      // return "5";
    }
    if (lvtype === "Examination Leave") {
      resolve("5");
      // return "5";
    }
  });
};

exports.getAllHod = () => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE hod='YES' AND Status='OK'`,
      (err, rows) => {
        resolve(rows);
      }
    );
  });
};

exports.submitLeaveApp = (
  startDate,
  endDate,
  daysAppliedFor,
  staffId,
  leaveBonusApplied,
  hodId,
  ltype
) => {
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT startDate, endDate FROM staffleave WHERE (status='PENDING' OR status='APPROVED') AND staffid='${staffId}' AND startDate >= '${startDate}' AND endDate <= '${endDate}'`,
      (err, rows) => {
        if (rows && rows !== null && rows.length !== 0) {
          const dateRangeExists = true;
          /*const existingStartDate = new Date(rows[0]['startDate']);
          const existingendDate = new Date(rows[0]['endDate']);*/
          resolve(dateRangeExists);
        } else {
          connection.query(
            `INSERT INTO staffleave (startDate, endDate, status, daysno, staffid, lvyear, leavetype, leaveBonus, bonusG, ApprovedL, hodid) VALUES('${startDate}', '${endDate}', 'PENDING', '${daysAppliedFor}', '${staffId}', '${currentYear}', '${ltype}', '${leaveBonusApplied}', 'NG', 'NO', '${hodId}')`,
            (err, rows) => {
              console.log(err);
              if (!err) {
                connection.query(
                  `SELECT * FROM staffs where staffid='${hodId}'`,
                  (err, rows) => {
                    resolve(rows);
                  }
                );
              }
            }
          );
        }
      }
    );
  });
};

exports.returnFromLeave = (staffId, hodId, leaveId) => {
  return new Promise((resolve, reject) => {
    const todayDate = new Date().toISOString().split("T")[0];
    connection.query(
      `UPDATE staffleave SET returndatestaff='${todayDate}' WHERE id='${leaveId}'`,
      (err, rows) => {
        console.log(err);
        if (!err) {
          connection.query(
            `SELECT * FROM staffs where staffid='${hodId}'`,
            (err, rows) => {
              rows[0].returndatestaff = todayDate;
              resolve(rows);
            }
          );
        }
      }
    );
  });
};

exports.getLeaveHistory = (staffId) => {
  console.log(staffId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE staffid='${staffId}' AND lvyear='${currentYear}' AND status='APPROVED'`,
      (err, rows) => {
        // console.log(rows);
        resolve(rows);
      }
    );
  });
};

exports.getLeaveApprovedoldme = (hodId, action) => {
  console.log(hodId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    if (action === "approve") {
      connection.query(
        `SELECT * FROM staffleave WHERE ((hodid='${hodId}' AND passlevel1!='YES') OR (passlevel1='YES' AND hodid2='${hodId}')) AND lvyear='${currentYear}' AND ApprovedL='NO'`,
        (err, rows) => {
          // console.log(rows);
          resolve(rows);
        }
      );
    } else {
      connection.query(
        `SELECT * FROM staffleave WHERE (hodid='${hodId}' OR hodid2decline='${hodId}') AND lvyear='${currentYear}' AND ApprovedL='NO'`,
        (err, rows) => {
          // console.log(rows);
          resolve(rows);
        }
      );
    }
  });
};

exports.getLeaveApproved = (hodId, action) => {
  console.log(hodId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    if (action === "approve") {
      connection.query(
        `SELECT * FROM staffleave WHERE ((hodid='${hodId}' AND passlevel1!='YES') OR (passlevel1='YES' AND (hodid2='${hodId}' OR hodid2decline='${hodId}'))) AND lvyear='${currentYear}' AND ApprovedL='NO'`,
        (err, rows) => {
          // console.log(rows);
          resolve(rows);
        }
      );
    } else {
      connection.query(
        `SELECT * FROM staffleave WHERE ((hodid='${hodId}' AND passlevel1decline!='YES') OR (passlevel1='YES' AND (hodid2='${hodId}' OR hodid2decline='${hodId}'))) AND lvyear='${currentYear}' AND ApprovedL='NO'`,
        (err, rows) => {
          // console.log(rows);
          resolve(rows);
        }
      );
}
});
};

exports.checkLeaveStatus = (staffId) => {
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE staffid='${staffId} AND lvyear='${currentYear}' AND returnleave=''`,
      (err, rows) => {
        resolve(rows);
      }
    );
  });
};

exports.getLeaveAdminApproved = (adminId) => {
  console.log(adminId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE STATUS='PENDING' AND lvyear='${currentYear}' AND ApprovedL='YES'`,
      (err, rows) => {
        // console.log(rows);
        resolve(rows);
      }
    );
  });
};
exports.getLeaveReturn = (staffId) => {
  console.log(staffId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE staffid='${staffId}' AND lvyear='${currentYear}' AND status='APPROVED' AND ApprovedL='YES'  AND returndatestaff=''`,
      (err, rows) => {
        // console.log(rows);
        resolve(rows);
      }
    );
  });
};
//get hod to confirm resumption and update database
exports.getPendingResume = (staffId,hodId) => {
  console.log(staffId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE (hodid='${hodId}' OR hodid2='${hodId}') AND lvyear='${currentYear}' AND status='APPROVED' AND ApprovedL='YES' AND returndatestaff!='' AND returnleave=''`,
      (err, rows) => {
        // console.log(rows);
        resolve(rows);
      }
    );
  });
};
exports.sendToSecondLevel = (leaveId, secondLevel, reason1, action) => {
  return new Promise((resolve, reject) => {
    if (action === "apply") {
      connection.query(
        `UPDATE staffleave SET passlevel1='YES', hodid2='${secondLevel}' WHERE id='${leaveId}'`,
        (err, rows) => {
          //todo: send mail to hod
          connection.query(
            `SELECT * FROM staffs WHERE staffid='${secondLevel}'`,
            (err, rows1) => {
              this.sendmail(
                rows1[0].email,
                `A leave request has been forwarded to you for further action. <p>Please click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.</p> Thank you.`,
                "Two level approval"
              );
              resolve("Leave approved!");
            }
          );
        }
      );
    } else if (action === "decline") {
      connection.query(
        `UPDATE staffleave SET passlevel1decline='YES', hodid2decline='${secondLevel}', comment='${reason1}' WHERE id='${leaveId}'`,
        (err, _) => {
          connection.query(
            `SELECT * FROM staffs WHERE staffid='${secondLevel}'`,
            (err, rows) => {
              this.sendmail(
                rows[0].email,
                `A leave request has been forwarded to you for further action. <p>Please click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.</p> Thank you.`,
                "Two level decline"
              );
              resolve("Leave decline sent to next level!");
            }
          );
        }
      );
    } else {
      resolve("An error occured!");
    }
  });
};
exports.approveLeave = (leaveId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffleave WHERE id='${leaveId}'`,
      (err, rows1) => {
        connection.query(
          `SELECT * FROM staffs WHERE staffid = '${rows1[0].staffid}'`,
          (err, rows2) => {
            if (rows2[0].twolevel.toString().toUpperCase() === "YES" && rows1[0].passlevel1.toString() === '') {
              // console.log(rows2);
              this.getAllHod().then((result) => {
                resolve({ twolevel: true, allHODs: result });
              });
            } else {
              connection.query(
                `UPDATE staffleave SET ApprovedL='YES' WHERE id='${leaveId}'`,
                (err, _) => {
                  console.log(rows1);
                  connection.query(
                    `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                    (err, rows) => {
                      resolve({
                        twolevel: false,
                        admin: rows,
                        leaveDetails: rows1,
                      });
                    }
                  );
                }
              );
            }
          }
        );
      }
    );
  });
};

exports.sendToSecondLevelold = (leaveId, secondLevel) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE staffleave SET passlevel1='YES', hodid2='${secondLevel}' WHERE id='${leaveId}'`,
      (err, rows) => {
        connection.query(
          `SELECT * FROM staffs WHERE staffid='${secondLevel}'`,
          (err, rows1) => {
            this.sendmail(
              rows1.email,
              `A leave request has been forwarded to you for further action. <p>Please click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.</p> Thank you.`,
              "Two level approval"
            );
            resolve("Leave approved!");
          }
        );
      }
    );
  });
};

exports.rejectLeave = (leaveId, comment) => {
    console.log('id - '+leaveId);
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffleave WHERE id='${leaveId}'`,
      (err, rows1) => {
        connection.query(
          `SELECT * FROM staffs WHERE staffid = '${rows1[0].staffid}'`,
          (err, rows2) => {
            if (rows2[0].twolevel.toString().toUpperCase() === "YES" && (rows1[0].passlevel1decline.toString() === '' && rows1[0].passlevel1.toString() === '')) {
               console.log('is 2 levels - '+rows2);
              this.getAllHod().then((result) => {
                resolve({ twolevel: true, allHODs: result });
              });
            } else {
              connection.query(
                `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
                (err, _) => {
                  console.log(rows1);
                  connection.query(
                    `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                    (err, rows) => {
                      resolve({
                        twolevel: false,
                        admin: rows,
                        leaveDetails: rows1,
                      });
                    }
                  );
                }
              );
            }
          }
        );
      }
    );
  });
};

exports.rejectLeaveOld = (leaveId, comment, passedFirstLevel) => {
    console.log('passed first level? '+passedFirstLevel);
     
  return new Promise((resolve, reject) => {
   
       connection.query(
      `SELECT * FROM staffleave WHERE id='${leaveId}'`,
      (err, rows1) => {
        connection.query(
          `SELECT * FROM staffs WHERE staffid = '${rows1[0].staffid}'`,
          (err, rows2) => {
                console.log('passed first level? '+passedFirstLevel);
            if (passedFirstLevel=='true' || rows2[0].twolevel.toString().toUpperCase() === "YES") {
               
              if (passedFirstLevel) {
                connection.query(
                  `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', commentlevel2='${comment}' WHERE id='${leaveId}'`,
                  (err, _) => {
                    connection.query(
                      `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                      (err4, rows3) => {
                        resolve({
                          admin: rows3,
                          leaveDetails: rows1,
                          twoLevel: false,
                        });
                      }
                    );
                  }
                );
              } else {
                this.getAllHod().then((result) => {
                  connection.query(
                    `UPDATE staffleave SET passlevel1decline='YES',comment='${comment}' WHERE id='${leaveId}'`,
                    (err, _) => {
                      resolve({ allHODs: result, twoLevel: true });
                    }
                  );
                });
              }
            } else {
              connection.query(
                `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
                (err3, _) => {
                  connection.query(
                    `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                    (err4, rows3) => {
                      resolve({
                        admin: rows3,
                        leaveDetails: rows1,
                        twoLevel: false,
                      });
                    }
                  );
                }
              );
            }
          }
        );
      }
    );

    // connection.query(
    //   `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
    //   (err, _) => {
    //     // console.log('update - '+rows);
    //     if (_) {
    //       connection.query(
    //         `SELECT * FROM staffleave WHERE id='${leaveId}'`,
    //         (err, rows1) => {
    //           console.log(rows1);
    //           connection.query(
    //             `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
    //             (err, rows) => {
    //               resolve({ admin: rows, leaveDetails: rows1 });
    //             }
    //           );
    //         }
    //       );
    //     }
    //   }
    // );
  });
};
exports.sendToSecondLevelResume = (leaveId, secondLevel) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE staffleave SET passlevel1resume='YES' WHERE id='${leaveId}'`,
      (err, rows) => {
        connection.query(
          `SELECT * FROM staffs WHERE staffid='${secondLevel}'`,
          (err, rows1) => {
            this.sendmail(
              rows1.email,
              `A leave resumption has been forwarded to you for further action. <p>Please click the link below: https://evanspublishersltdportal.com/evansportal/index.php and take action.</p> Thank you.`,
              "Two level approval"
            );
            resolve("Leave approved!");
          }
        );
      }
    );
  });
};
exports.rejectLeaveold2 = (leaveId, comment, passedFirstLevel) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffleave WHERE id='${leaveId}'`,
      (err1, rows1) => {
        connection.query(
          `SELECT * FROM staffs WHERE staffid='${rows1[0].staffid}'`,
          (err2, rows2) => {
            if (rows2[0].twolevel === "YES") {
              if (passedFirstLevel) {
                connection.query(
                  `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
                  (err3, _) => {
                    connection.query(
                      `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                      (err4, rows3) => {
                        resolve({
                          admin: rows3,
                          leaveDetails: rows1,
                          twoLevel: false,
                        });
                      }
                    );
                  }
                );
              } else {
                this.getAllHod().then((result) => {
                  connection.query(
                    `UPDATE staffleave SET passLevel1Reject='YES' WHERE id='${leaveId}'`,
                    (err, _) => {
                      resolve({ allHODs: result, twoLevel: true });
                    }
                  );
                });
              }
            } else {
              connection.query(
                `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
                (err3, _) => {
                  connection.query(
                    `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                    (err4, rows3) => {
                      resolve({
                        admin: rows3,
                        leaveDetails: rows1,
                        twoLevel: false,
                      });
                    }
                  );
                }
              );
            }
          }
        );
      }
    );

    // connection.query(
    //   `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
    //   (err, _) => {
    //     // console.log('update - '+rows);
    //     if (_) {
    //       connection.query(
    //         `SELECT * FROM staffleave WHERE id='${leaveId}'`,
    //         (err, rows1) => {
    //           console.log(rows1);
    //           connection.query(
    //             `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
    //             (err, rows) => {
    //               resolve({ admin: rows, leaveDetails: rows1 });
    //             }
    //           );
    //         }
    //       );
    //     }
    //   }
    // );
  });
};
exports.rejectLeaveold = (leaveId, comment) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE staffleave SET ApprovedL='YES', status='REJECTED', comment='${comment}' WHERE id='${leaveId}'`,
      (err, _) => {
        // console.log('update - '+rows);
        if (_) {
          connection.query(
            `SELECT * FROM staffleave WHERE id='${leaveId}'`,
            (err, rows1) => {
              console.log(rows1);
              connection.query(
                `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                (err, rows) => {
                  resolve({ admin: rows, leaveDetails: rows1 });
                }
              );
            }
          );
        }
      }
    );
  });
};


//send final resumption of duty to admin manager
exports.finalConfirmResume = (leaveId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffleave WHERE id='${leaveId}'`,
      (err, rows1) => {
        console.log(rows1);
        connection.query(
          `SELECT * FROM staffs WHERE staffid = '${rows1[0].staffid}'`,
          (err, rows3) => {
            if (
              rows3[0].twolevel.toString().toUpperCase() === "YES" &&
              rows1[0].passlevel1resume.toString().toUpperCase() === ""
            ) {
              this.getAllHod().then((result) => {
                resolve({ twoLevel: true, allHODs: result, leaveDetails: rows1 });
              });
            } else {
              connection.query(
                `UPDATE staffleave SET returnleave='YES' WHERE id='${leaveId}'`,
                (err, rows) => {
                  if (rows) {
                    connection.query(
                      `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                      (err, rows2) => {
                        this.getAllHod().then((result) => {
                          resolve({
                            admin: rows2,
                            leaveDetails: rows1,
                            allHODs: result,
                            twoLevel: false,
                          });
                        });
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    );
  });
};
exports.approveLeaveAdmin = (leaveId, expectedReturn) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE staffleave SET status='APPROVED', returndateA='${expectedReturn}' WHERE id='${leaveId}'`,
      (err, _) => {
        if (_) {
          connection.query(
            `SELECT * FROM staffleave WHERE id='${leaveId}'`,
            (err, rows1) => {
              console.log(rows1);
              resolve(rows1);
            }
          );
        }
      }
    );
  });
};
exports.get_return_leave = (staffId) => {
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE staffid='${staffId}' AND lvyear='${currentYear}' AND status='PENDING'`,
      (err, rows) => {
        resolve(rows);
      }
    );
  });
};

exports.get_approve_leave = (staffId) => {
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE hodid='${staffId}' AND lvyear='${currentYear}' AND status='PENDING'`,
      (err, rows) => {
        resolve(rows);
      }
    );
  });
};

exports.getPayslip = (staffId, year, month) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM pay WHERE name = '${staffId}' AND month = '${month}' AND  year = '${year}'`,
      (err, rows) => {
        console.log("payslip - " + rows);
        resolve(rows);
      }
    );
  });
};

exports.checkAdminHod = (staffId) => {
  const adminPosId = "POS10";
  let isHod;
  let isAdmin;
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE staffid = '${staffId}'`,
      (err, rows) => {
        if (!err) {
          if (rows[0]["Position"] === adminPosId) {
            isAdmin = true;
          } else {
            isAdmin = false;
          }

          if (rows[0]["hod"] === "YES") {
            isHod = true;
          } else {
            isHod = false;
          }
          resolve({ admin: isAdmin, hod: isHod });
        }
        if (!rows) {
          console.log("genfunct - " + err);
          reject(err);
        }
      }
    );
  });
};
//get staff name
exports.getStaffName = (staffId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE staffid = '${staffId}'`,
      (err, rows) => {
        if (!err) {
          resolve(`${rows[0]["stafsurname"]} ${rows[0]["stafirstname"]}`);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};

exports.getStaffPosition = (positionId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM positions WHERE positid = '${positionId}'`,
      (err, rows) => {
        if (!err) {
          resolve(rows[0]["posit"]);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};

exports.getStaffEmail = (staffId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE staffid = '${staffId}'`,
      (err, rows) => {
        if (!err) {
          resolve(rows[0]["email"]);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};
//get recritment date
exports.getRecruitDate = (staffId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE staffid = '${staffId}'`,
      (err, rows) => {
        if (!err) {
          resolve({
            recDate: rows[0]["RecDate"],
            employStatus: rows[0]["employstatus"],
          });
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};

exports.checkPosition = (staffId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE staffid = '${staffId}'`,
      (err, rows) => {
        const posId = rows[0]["Position"];
        connection.query(
          `SELECT * FROM positions WHERE positid='${posId}'`,
          (err1, rows1) => {
            console.log(rows1[0]["posit"]);
            resolve(rows1[0]["posit"]);
          }
        );
      }
    );
  });
};

// change password function
exports.changePassword = (newPassword, email) => {
  return new Promise((resolve, reject) => {
    // query to update user password
    const updatePasswordQuery = `UPDATE staffs SET passme = ? WHERE email = ?`;
    connection.query(
      updatePasswordQuery,
      [newPassword, email],
      (error, results) => {
        if (error) {
          resolve("Error occured");
        } else {
          this.sendmail(email, `Your password was changed on ${new Date()}`);

          connection.query(
            `SELECT * FROM staffs WHERE email='${email}'`,
            (err, rows) => {
              connection.query(
                `DELETE FROM codes WHERE staffid='${rows[0]["staffid"]}'`,
                (err, rows) => {
                  resolve("Password changed successfully");
                }
              );
            }
          );
        }
      }
    );
  });
};
//send OTP
function generateCode(staffId) {
  return new Promise((resolve, reject) => {
    let code = "";
    const possible = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjklmnpqrstuvwxyz23456789";

    for (let i = 0; i < 7; i++) {
      code += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    connection.query(
      `INSERT INTO codes (code, staffid) VALUES ('${code}', '${staffId}')`,
      (error, rows) => {
        console.log(code);
        console.log(staffId);
        resolve(code);
      }
    );
  });
}

exports.sendOTPToStaff = (email) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE email='${email}'`,
      (err, rows) => {
        console.log(rows.length > 0);
        if (rows[0]) {
          console.log(rows);
          generateCode(rows[0]["staffid"]).then((code) => {
            let message = `Your one time password to reset your password is - ${code}`;
            this.sendmail(rows[0]["email"], message, "Password Reset", "");
            resolve("Check your email");
          });
        } else {
          resolve("Email is not registered");
        }
      }
    );
  });
};

exports.checkCode = (code, email) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffs WHERE email = '${email}' LIMIT 1`,
      (err, rows) => {
        connection.query(
          `SELECT * FROM codes WHERE code = '${code}' and staffid = '${rows[0].staffid}'`,
          (err, rows) => {
            console.log(rows);
            if (rows) {
              if (rows.length > 0) {
                resolve(true);
              } else {
                resolve(false);
              }
            }else {
              resolve(false);
            }
          }
        );
      }
    );
  });
};

exports.getAreaOfficeName = (positionId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM areaoffice WHERE OfficeID = '${positionId}'`,
      (err, rows) => {
        if (!err) {
          resolve(rows[0]["Areaoffice"]);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};

exports.getDepartmentName = (positionId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM department WHERE departmentid = '${positionId}'`,
      (err, rows) => {
        if (!err) {
          resolve(rows[0]["departmentname"]);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};
exports.getStaffStepName = (positionId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffstep WHERE stepid = '${positionId}'`,
      (err, rows) => {
        if (!err) {
          resolve(rows[0]["stepname"]);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};
exports.getStaffGradeName = (positionId) => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM staffgr WHERE gradeid = '${positionId}'`,
      (err, rows) => {
        if (!err) {
          resolve(rows[0]["gradename"]);
        }
        if (!rows) {
          reject(err);
        }
      }
    );
  });
};

exports.cancelLeave = (leaveId, comment) => {
  return new Promise((resolve, reject) => {
      connection.query(
        `SELECT * FROM staffleave WHERE id='${leaveId}'`,
        (err, rows1) => {
          connection.query(
            `SELECT * FROM staffs WHERE staffid = '${rows1[0].staffid}'`,
            (err, rows2) => {
              console.log(rows2[0].twolevel,comment);
              connection.query(
                `UPDATE staffleave SET status='CANCELLED', cancelreason='${comment}' WHERE id='${leaveId}'`,
                (err3, _) => {
                  connection.query(
                    `SELECT * FROM staffs WHERE Position='POS10' LIMIT 1`,
                    (err4, rows3) => {
                      resolve({
                        admin: rows3,
                        leaveDetails: rows1,
                        twoLevel: false,
                      });
                    }
                  );
                }
              );
            }
          );
        }
 );
});
};
exports.getPendingLeaveHistory = (staffId) => {
  console.log(staffId);
  return new Promise((resolve, reject) => {
    const currentYear = new Date().getFullYear();
    connection.query(
      `SELECT * FROM staffleave WHERE staffid='${staffId}' AND lvyear='${currentYear}' AND status='PENDING'`,
      (err, rows) => {
        // console.log(rows);
        resolve(rows);
      }
);
});
};
//view newsletter
exports.getNews = () => {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM news ORDER BY opedate DESC`, (err, rows) => {
      resolve(rows);
});
});
};
//VIEW BIRTHDAY
exports.getBirthdays = () => {
    let today = new Date();
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM staffs WHERE DateBirth!='' AND Status='OK' ORDER BY DateBirth ASC`, (err, rows) => {
        let results = [];
        console.log(rows.length);
        for (let i =0;i<rows.length;i++){
            console.log('dghhuuyuy  '+typeof rows[i].DateBirth);
            let dOB = new Date(rows[i].DateBirth);
            console.log(dOB);
            if (dOB.getUTCMonth() === today.getUTCMonth()){
                results.push(rows[i]);
            }
        }
        
        
        
        if (results.length == 0){
            resolve(results);
        }else{
        results.sort(function(a,b){
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return new Date(a.DateBirth).getDate() - new Date(b.DateBirth).getDate();
        });
      resolve(results);}
});
});
};
//view today clebrant
exports.getBirthdaystoday = () => {
    let today = new Date();
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM staffs WHERE DateBirth!='' AND Status='OK' ORDER BY DateBirth ASC`, (err, rows) => {
        let results = [];
        console.log(rows.length);
        for (let i =0;i<rows.length;i++){
            console.log('dghhuuyuy  '+typeof rows[i].DateBirth);
            let dOB = new Date(rows[i].DateBirth);
            console.log(dOB);
            if (dOB.getUTCMonth() === today.getUTCMonth() && dOB.getUTCDate() === today.getUTCDate()  ){
                results.push(rows[i]);
            }
        }
        if (results.length == 0){
            resolve(results);
        }else{
        results.sort(function(a,b){
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return new Date(a.DateBirth).getDate() - new Date(b.DateBirth).getDate();
        });
      resolve(results);}
});
});
};

//view feedbak from staff
exports.getviewfeedback = () => {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM feedback ORDER BY opedate DESC`, (err, rows) => {
      resolve(rows);
});
});
};

//save birthday wishes
exports.saveBirthdayswish = (wisher, wishes, staffId) => {
    let today = new Date();
    const offset = today.getTimezoneOffset()
today = new Date(today.getTime() - (offset*60*1000))
let formattedDate = today.toISOString().split('T')[0]
  return new Promise((resolve, reject) => {
    connection.query(`INSERT INTO birthdaywishes (staffid, birthdaywishes, opedate, wisherid) VALUES('${staffId}', '${wishes}', '${formattedDate}', '${wisher}')`, (err, rows) => {
      resolve(rows);
});
});
};

exports.getBirthdayswish = (staffId) => {
  return new Promise((resolve, reject) => {
    connection.query(`SELECT * FROM birthdaywishes WHERE staffid='${staffId}' ORDER BY opedate DESC`, (err, rows) => {
      resolve(rows);
});
});
};
exports.saveFeedback = (feedback, staffid) => {
  let today = new Date();
  const offset = today.getTimezoneOffset()
    today = new Date(today.getTime() - (offset*60*1000))
let formattedDate = today.toISOString().split('T')[0]
  return new Promise((resolve, reject) => {
    connection.query(
      `INSERT INTO feedback (feedback, staffid, opedate) Values('${feedback}', '${staffid}', '${formattedDate}')`,
      (err, rows) => {
        resolve(rows);
      }
    );
  });
};
