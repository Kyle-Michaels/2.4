const express = require('express');
const { S3Client, ListObjectsV2Command, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs')
const fileUpload = require('express-fileupload')

app = express();
app.use(fileUpload());

const s3Client = new S3Client({
  region: 'us-west-1'
})

const bucket = process.env.BUCKET_NAME;

app.get('/', (req, res) => {
  let responseText = '2.4 Task';
  res.send(responseText);
});

app.get('/images', (req, res) => {
  listObjectsParams = {
    Bucket: bucket
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
    Bucket: bucket,
    Key: fileName,
    Body: fs.readFileSync(tempPath)
  };
  s3Client.send(new PutObjectCommand(putObjectParams))
    .then((putObjectResponse) => {
      res.send(putObjectResponse)
    })
})

app.get('/images/:fileName', async (req, res) => {
  getObjectParams = {
    Bucket: bucket,
    Key: req.params.fileName
  }
  await s3Client.send(new GetObjectCommand(getObjectParams))
    .then(async (getObjectResponse) => {
      res.writeHead(200, {
        'Content-Length': getObjectResponse.ContentLength
      });
      getObjectResponse.Body.transformToByteArray().then((buffer) => {
        res.end(buffer);
      });
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