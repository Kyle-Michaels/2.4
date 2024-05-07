const express = require('express');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs')
const fileUpload = require('express-fileupload')

app = express();
app.use(fileUpload());

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:4566',
  forcePathStyle: true
})

app.get('/', (req, res) => {
  let responseText = '2.4 Task';
  res.send(responseText);
});

app.get('/images', (req, res) => {
  listObjectsParams = {
    Bucket: 'my-cool-local-bucket'
  };
  s3Client.send(new ListObjectsV2Command(listObjectsParams))
    .then((listObjectsResponse) => {
      res.send(listObjectsResponse.Contents)
    })
});

const UPLOAD_TEMP_PATH = './temp'
app.post('/images', (req, res) => {
  const file = req.files.image
  const fileName = req.files.image.name
  const tempPath = `${UPLOAD_TEMP_PATH}/${fileName}`
  file.mv(tempPath, (err) => { res.status(500) })
  const putObjectParams = {
    Bucket: 'my-cool-local-bucket',
    Key: fileName
  };
  s3Client.send(new PutObjectCommand(putObjectParams))
    .then((putObjectResponse) => {
      res.send(putObjectResponse)
    })
})

app.get('/images/:fileName', async (req, res) => {
  const key = req.params.fileName;
  getObjectParams = {
    Bucket: 'my-cool-local-bucket',
    Key: key
  }
  await s3Client.send(new GetObjectCommand(getObjectParams))
    .then((getObjectResponse) => {
      console.log(getObjectResponse)
      res.send(getObjectResponse)
    })
})

// error handling

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// listen for requests
const port = 8080;
app.listen(port, () => {
  console.log('App is listening on port ' + port);
});