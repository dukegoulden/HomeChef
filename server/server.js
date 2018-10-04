require('babel-register');
require('dotenv').config();
/* **** Express modules **** */
const express = require('express');

const app = express();
const port = process.env.PORT || 5678;
const morgan = require('morgan');

/* **** JWT and Passport Modules **** */
const cookieParser = require('cookie-parser');

/* **** Server-side Rendering Modules **** */
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const ReactRouter = require('react-router-dom');
const _ = require('lodash');
const fs = require('fs');
const bodyParser = require('body-parser');
const App = require('../src/app/app').default;

const { StaticRouter } = ReactRouter;
const baseTemplate = fs.readFileSync(`${__dirname}/../src/index.html`);
const template = _.template(baseTemplate); // returns a function

/* **** DB Connection modules **** */
const db = require('./../database/database');
const chefs = require('./../database/chefs.js');
const util = require('./util');

/* **** GraphQL Modules **** */
// const graphqlHTTP = require('express-graphql');
// const gqlSchema = require('./schema');

/* **** Apply universal middleware **** */
app.use('/public', express.static(`${__dirname}/../public`));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(morgan({ format: 'dev' }));

// can play with GraphQL queries in the browser at localhost:5678/graphql
// app.use('/graphql', graphqlHTTP({
//   schema: gqlSchema,
//   graphiql: true,
// }));

/* **** Authentication **** */
// app.use(util.checkIfAuthenticated, (err, req, res, next) => {
//   if (err.name === 'UnauthorizedError') {
//     res.status(401);
//     console.log('req is', req, 'req.headers.host is', req.headers.host);
//     res.redirect('/');
//   }
//   next();
// }); // this will see if all incoming requests are authenticated and if not redirect to the home page, but not currently working

/* **** WIP Signup Endpoint ****
app.post('/signup', (req, res) => {
  console.log('incoming signup request is', req);
  const { or } = db.connection.Op;
  const { username, password, email } = req.body; // for app
  // const { username, password } = req.query; // for postman
  if (!username || !password) {
    return res.status(401).send('no fields');
  }

  return db.Chef.findOne({
    where: {
      [or]: [
        { username },
        { email },
      ],
    },
  })
    .then((result) => {
      if (result) {
        return res.status(400).send('that username or email already exists');
      }
      return db.Chef.create({ username, password });
    })
    .then(() => res.send('ok'));
});
*/

app.post('/login', (req, res) => {
  console.log('incoming login request is', req);
  const { username, password } = req.body; // for app
  // const { username, password } = req.query; // for postman
  if (!username || !password) {
    return res.status(401).send('no fields');
  }
  db.Chef.findOne({ where: { username } })
    .then((result) => {
      if (!result) {
        return res.status(400).send('user not found');
      }
      console.log('found record is', result);
      // TODO: add bcrypt match here
      const token = util.createJWTBearerToken(result);
      // const jwtBearerToken = jwt.sign({}, RSA_PRIVATE_KEY, {
      //   algorithm: 'RS256',
      //   expiresIn: 120000000,
      //   subject: result.id.toString(),
      // });
      res.cookie('SESSIONID', token, { httpOnly: false, secure: false });
      res.send();
      // res.send(token);
    });
  // .catch(err => res.status(401).send({ err }));
});

app.get('/loginTest', util.checkIfAuthenticated, (req, res) => {
  // console.log('req.user is', req.user, 'res currently is', res);
  res.status(200);
  res.send('ya done good!');
});


/* **** **** */

app.get('/api/chef/accountInfo', (req, res) => {
  const { username } = req.query;
  console.log('username is', username);
  // chefs.findChef(username);
  db.Chef.findOne({ where: { username } })
    .then(accountInfo => res.status(200).send(accountInfo))
    .catch(err => console.log(err));
});

app.patch('/api/chef/accountInfo', (req, res) => {
  console.log('incoming patch request to chef/accountInfo is', req);
  chefs.upsertAccountInfo(req.body.data).then((created) => {
    if (created) {
      res.status(200);
      res.send('Successfully stored');
    } else {
      res.status(200);
      res.send('Successfully inserted');
    }
  });
});

// app.post('/api/user/login', (req, res) => {
//   const username = req.body.username;
//   const password = req.body.password;
//   db.User.findOne({ where: { username } }).then((res) => {
//     if (res.length === 0) {
//       console.log('username not found');
//       res.redirect('/api/user/signup');
//     }
//   });
// });

app.get(
  '/api/user/accountInfo',
  (req, res, next) => console.log('get request to user/accountInfo') || next(),
  (req, res) => {
    const { username } = req.query;
    console.log('username is', username);
    db.User.findOne({ where: { username } })
      .then(accountInfo => res.status(200).send(accountInfo))
      .catch(err => console.log(err));
  },
);

app.get('/api/chef/all', (req, res) => {
  db.Chef.findAll()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch(err => console.log(err));
});

app.get('/api/chef/schedule', (req, res) => {
  const chefId = req.query.id;
  db.ItemEvent.findAll({
    where: { chefId },
    include: [
      {
        model: db.Event,
        where: { chefId },
        attributes: ['id', 'date', 'startTime', 'endTime', 'chefId', 'createdAt', 'updatedAt'],
      },
      {
        model: db.MenuItem,
        where: { chefId },
        attributes: ['id', 'name', 'description', 'price', 'imageUrl', 'chefId'],
      },
    ],
  })
    .then((data) => {
      const schedule = util.organizeSchedule(data);
      res.send(schedule);
    })
    .catch(err => console.log(err));
});

app.get('/api/chef/menu', (req, res) => {
  const chefId = req.query.id;
  db.MenuItem.findAll({ where: { chefId } })
    .then((data) => {
      res.send(data);
    })
    .catch(err => console.log(err));
});

app.post('/api/chef/menu/add', (req, res) => {
  const item = req.body;
  db.MenuItem.create({
    name: item.name,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    chefId: item.chefId,
  })
    .then((data) => {
      res.send(data);
    })
    .catch(err => console.log(err));
});

app.post('/api/chef/menu/update', (req, res) => {
  const item = req.body;
  db.MenuItem.update(
    {
      name: item.name,
      description: item.description,
      price: item.price,
      imageUrl: item.imageUrl,
    },
    { where: { id: item.id } },
  )
    .then((data) => {
      res.send(data);
    })
    .catch(err => console.log(err));
});

app.get('/api/chef/events', (req, res) => {
  const chefId = req.query.id;
  db.Event.findAll({ where: { chefId } })
    .then((data) => {
      res.send(data);
    })
    .catch(err => console.log(err));
});

app.post('/api/chef/event/create', (req, res) => {
  const event = req.body;
  db.Event.create({
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    chefId: event.chefId,
  })
    .then((data) => {
      event.updatedMenuItems.forEach((item) => {
        db.ItemEvent.create({
          quantity: item.quantity,
          eventId: data.id,
          menuItemId: item.id,
          chefId: event.chefId,
          reservations: 0,
        });
      });
    })
    .then((data) => {
      res.send(data);
    })
    .catch(err => console.log(err));
});

app.post('/api/chef/event/update', (req, res) => {
  // {eventId, date, startTime, endTime, chefId, menuItems:[{id, quantity}] }
  const event = req.body;
  db.Event.update(
    {
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
    },
    { where: { id: event.id } },
  )
    .then(() => {
      event.updatedMenuItems.forEach((item) => {
        db.ItemEvent.update(
          { quantity: item.quantity },
          { where: { eventId: event.id, menuItemId: item.id } },
        );
      });
    })
    .then((data) => {
      res.send(data);
    })
    .catch(err => console.log(err));
});

/* **** Catch All - all server requests above here **** */
app.use(util.checkIfAuthenticated, (req, res) => {
  console.log(req.url);
  const context = {};
  const body = ReactDOMServer.renderToString(
    // eslint-disable max-len
    React.createElement(StaticRouter, { location: req.url, context }, React.createElement(App)),
  );

  // TODO: read up on context.url and redirection (e.g. Brian Holt frontend masters)
  // TODO: make sure any error gets error message
  if (context.url) {
    res.redirect(301, context.url);
  }

  res.write(template({ body }));
  res.end();
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
