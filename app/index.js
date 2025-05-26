const express = require('express');
const app = express();
const port = 80;

app.get('/', (req, res) => {
  res.send('Hello from Node.js app running on custom AMI! by using packer workshop by veera');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
