const db = require("../models/usersModels");

const userController = {};

userController.createUser = async (req, res, next) => {
  const {
    name,
    username,
    password: password_digest,
    email,
    gender,
    birthdate,
    skill: skill_level,
    bio,
    location,
    genres,
    instruments,
  } = req.body;

  res.locals.user = req.body;

  const createUserQuery = `
    INSERT INTO users (name, username, password_digest, email, gender, birthdate, skill_level, bio, location)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  let lowerUsername = username.toLowerCase();

  const params = [
    name,
    lowerUsername,
    password_digest,
    email,
    gender,
    birthdate,
    skill_level,
    "hello",
    location,
  ];

  try {
    const user = await db.query(createUserQuery, params);

    const userIdNum = user.rows[0]._id;
    console.log("userIdNum", userIdNum);
    res.locals.userId = userIdNum;

    const instrumentSql = `SELECT * FROM instruments WHERE instrument_name = '${instruments}'`;
    const instrumentIdQuery = await db.query(instrumentSql);

    const instrumentID = instrumentIdQuery.rows[0]._id;

    const instrumentsQuery = `
    INSERT INTO users_instruments (user_id, instrument_id)
    VALUES (${userIdNum},${instrumentID})
    `;
    const usersInstrumentsQuery = await db.query(instrumentsQuery);

    const genreSql = `SELECT * FROM genre WHERE genre_name = '${genres}'`;
    const genreIdQuery = await db.query(genreSql);

    const genreID = genreIdQuery.rows[0]._id;

    const genresQuery = `
    INSERT INTO users_genres (user_id, genre_id)
    VALUES (${userIdNum},${genreID})
    `;
    const usersGenresQuery = await db.query(genresQuery);

    return next();
  } catch (error) {
    return next({
      error: `userController.createUser; ERROR: ${error} `,
      message: "Error occured in conrollers/userController.js",
    });
  }
};

userController.viewUsers = async (req, res, next) => {
  const viewUsers = `
    SELECT users.*, instruments.instrument_name as instruments, genre.genre_name as genres FROM users
    INNER JOIN users_instruments ON users._id = users_instruments.user_id
    INNER JOIN instruments ON instruments._id = users_instruments.instrument_id
    INNER JOIN users_genres ON users._id = users_genres.user_id
    INNER JOIN genre ON genre._id = users_genres.genre_id
  `;

  try {
    const users = await db.query(viewUsers);
    const rows = users.rows;
    console.log(rows);
    const builtUsers = new Set();

    const formattedUsers = rows.reduce((acc, user) => {
      if (builtUsers.has(user.username)) {
        const filteredUser = acc.filter((u) => u.username === user.username)[0];
        const uniqueGenres = [
          ...new Set([...filteredUser.genres, user.genres]),
        ];
        const uniqueInstruments = [
          ...new Set([...filteredUser.instruments, user.instruments]),
        ];

        filteredUser.instruments = uniqueInstruments;
        filteredUser.genres = uniqueGenres;
      } else {
        builtUsers.add(user.username);

        const newUser = {
          ...user,
          instruments: [user.instruments],
          genres: [user.genres],
        };

        acc.push(newUser);
      }

      return acc;
    }, []);

    console.log("formatted users", formattedUsers);

    res.locals.users = formattedUsers;
    return next();
  } catch (error) {
    return next({
      error: `userController.viewUsers; ERROR: ${error} `,
      message: "Error occured in controllers/userController.js",
    });
  }
};

userController.findUser = async (req, res, next) => {
  let userID = req.cookies.SSID;
  console.log("userID", userID);

  const viewUsers = `
    SELECT users.*, instruments.instrument_name as instruments, genre.genre_name as genres FROM users
    INNER JOIN users_instruments ON users._id = users_instruments.user_id
    INNER JOIN instruments ON instruments._id = users_instruments.instrument_id
    INNER JOIN users_genres ON users._id = users_genres.user_id
    INNER JOIN genre ON genre._id = users_genres.genre_id
  `;

  try {
    const users = await db.query(viewUsers);
    const rows = users.rows;
    console.log("rows line 146", rows);
    const builtUsers = new Set();

    const formattedUsers = rows.reduce((acc, user) => {
      if (builtUsers.has(user.username)) {
        const filteredUser = acc.filter((u) => u.username === user.username)[0];
        const uniqueGenres = [
          ...new Set([...filteredUser.genres, user.genres]),
        ];
        const uniqueInstruments = [
          ...new Set([...filteredUser.instruments, user.instruments]),
        ];

        filteredUser.instruments = uniqueInstruments;
        filteredUser.genres = uniqueGenres;
      } else {
        builtUsers.add(user.username);

        const newUser = {
          ...user,
          instruments: [user.instruments],
          genres: [user.genres],
        };

        acc.push(newUser);
      }

      return acc;
    }, []);

    console.log("formatted users on profile page", formattedUsers);
    let userData;
    console.log("user ID line 224", userID);
    for (let i = 0; i < formattedUsers.length; i++) {
      console.log("formattedUsers[i]._id", formattedUsers[i]._id);
      if (formattedUsers[i]._id == userID) {
        userData = formattedUsers[i];
        break;
      }
    }

    console.log("userID", userID);
    console.log("line 182", userData);
    res.locals.user = userData;

    return next();
  } catch (error) {
    return next({
      error: `userController.findUser; ERROR: ${error} `,
      message: "Error occured in controllers/userController.js",
    });
  }
};

userController.updateUser = async (req, res, next) => {
  try {
    const updateUser = undefined;

    res.locals.user = await db.query(updateUser);
  } catch (error) {
    return next({
      error: `userController.updateUser; ERROR: ${error} `,
      message: "Error occured in controllers/userController.js",
    });
  }
};

userController.deleteUser = async (req, res, next) => {
  try {
    const deleteUser = undefined;
    await db.query(deleteUser);
    res.locals.message = "User has been deleted";
    return next();
  } catch (error) {
    return next({
      error: `userController.deleteUser; ERROR: ${error} `,
      message: "Error occured in controllers/userController.js",
    });
  }
};

userController.addFollower = async (req, res, next) => {
  try {
    console.log("inside addFollower");
    const { id } = req.body;
    const followerID = req.cookies.SSID;
    console.log("id", id);
    console.log("followerID", followerID);

    const followerSqlQuery = `
    INSERT INTO followers(user_id, follower_id)
    VALUES(${id}, ${followerID})
    `;
    let sqlRes = await db.query(followerSqlQuery);
    res.locals.user = sqlRes;
    return next();
  } catch (error) {
    return next({
      error: `userController.addFollower; ERROR: ${error} `,
      message: "Error occured in controllers/userController.js",
    });
  }
};

userController.verifyUser = async (req, res, next) => {
  console.log(req.body);

  const username = req.body.username;
  const password = req.body.password;

  if (
    username === undefined ||
    password === undefined ||
    username === "" ||
    password === ""
  ) {
    req.body.valid = false;
    next();
  }
  const params = [username, password];
  const selectUserQuery = `SELECT * FROM users WHERE username = $1 AND password_digest = $2`;

  try {
    const user = await db.query(selectUserQuery, params);

    if (user.rows[0] !== undefined) {
      res.locals.valid = true;
      res.locals.userId = user.rows[0]._id;
    } else {
      res.locals.valid = false;
    }
    next();
  } catch (err) {
    console.log("err on verifyUser");
    next({
      message: err,
    });
  }
};

module.exports = userController;
