require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const shortid = require('shortid');
const app = express();

// Create a DynamoDB client
const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Middleware to parse the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Handle the POST request to shorten a URL
app.post('/shorten', (req, res) => {
  const url = req.body.url;

  // Generate a random ID
  const id = shortid.generate();

  // Create a new item in the table
  const params = {
    TableName: process.env.TABLE_NAME,
    Item: {
      id: id,
      url: url
    }
  };

  docClient.put(params, (err, data) => {
    if (err) {
      console.log(err);
      res.send('Error: Could not create item in table');
    } else {
      // Return the shortened URL
      const shortUrl = process.env.BASE_URL + id;
      res.send(shortUrl);
    }
  });
});

// Handle the GET request to resolve a shortened URL
app.get('/:id', (req, res) => {
  const id = req.params.id;

  // Get the item from the table
  const params = {
    TableName: process.env.TABLE_NAME,
    Key: {
      id: id
    }
  };

  docClient.get(params, (err, data) => {
    if (err) {
      console.log(err);
      res.send('Error: Could not get item from table');
    } else if (!data.Item) {
      res.send('Error: Shortened URL not found');
    } else {
      // Redirect to the original URL
      res.redirect(data.Item.url);
    }
  });
});

// Start the server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
