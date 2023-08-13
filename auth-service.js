const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  //define the properties of the user
  username: String,
  password: String,
  email: String,
  loginHistory: [{ dateTime: Date, userAgent: String }],
});

let User; // to be defined on new connection (see initialize)

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(
      "Paste your MongoDB connection string here"
    );
    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.registerUser = function (userData) {
  return new Promise(function (resolve, reject) {
    if (userData.password != userData.password2) {
      reject("Passwords do not match");
    } else {
      let newUser = new User(userData);
      //hash the password
      bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(userData.password, salt, function (err, hash) {
          if (err) {
            reject("There was an error encrypting the password");
          } else {
            newUser.password = hash;
            newUser.save((err) => {
              if (err) {
                if (err.code == 11000) {
                  reject("User Name already taken");
                } else {
                  reject("There was an error creating the user: " + err);
                }
              } else {
                resolve();
              }
            });
          }
        });
      });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise(function (resolve, reject) {
    User.find({ username: userData.username })
      .exec()
      .then((users) => {
        if (users.length == 0) {
          reject("Unable to find user: " + userData.username);
        } else {
          bcrypt
            .compare(userData.password, users[0].password)
            .then((res) => {
              users[0].loginHistory.push({
                dateTime: new Date().toString(),
                userAgent: userData.userAgent,
              });

              User.update(
                { username: users[0].username },
                { $set: { loginHistory: users[0].loginHistory } }
              )
                .exec()
                .then(() => {
                  resolve(users[0]);
                })
                .catch((err) => {
                  reject("There was an error verifying the user: " + err);
                });
            })
            .catch((err) => {
              reject("Incorrect Password for user: " + userData.username);
            });

          //   if (users[0].password == userData.password) {
          //     users[0].loginHistory.push({
          //       dateTime: new Date().toString(),
          //       userAgent: userData.userAgent,
          //     });

          //     User.update(
          //       { username: users[0].username },
          //       { $set: { loginHistory: users[0].loginHistory } }
          //     )
          //       .exec()
          //       .then(() => {
          //         resolve(users[0]);
          //       })
          //       .catch((err) => {
          //         reject("There was an error verifying the user: " + err);
          //       });
          //   } else {
          //     reject("Incorrect Password for user: " + userData.username);
          //   }
        }
      })
      .catch((err) => {
        reject("Unable to find user: " + userData.username);
      });
  });
};
