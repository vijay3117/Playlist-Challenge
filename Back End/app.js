const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
let lists = {
  playlist: []
};
const dataPath = './data/playlist.json';
const folderName = './uploads/';
const port = 8001;

app.use(cors());


const URL = `http://localhost:${port}/`;


app.use(express.static(path.join(__dirname, 'uploads')));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, folderName)
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

/** File upload */
app.post("/upload", upload.array("uploads[]", 12), function (req, res) {

  const body = fs.readFileSync(folderName + req.files[0].filename);

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (!err) {
      lists = JSON.parse(data);
      req.files[0].base64 = body.toString('base64');
      req.files[0].album = req.body.album;
      req.files[0].duration = req.body.duration;
      lists.playlist.push(JSON.parse(JSON.stringify(req.files[0])));
    }
    fs.writeFileSync(dataPath, JSON.stringify(lists));
    res.send(lists);
  });

});

/** Get all uploaded files */
app.get("/getFiles", function (req, res) {
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      throw err;
    }
    res.send(data);
  });
});

/** Delete file */
app.delete("/delete/:filename", function (req, res) {
  const data = fs.readFileSync(dataPath);
  const fileList = JSON.parse(data);
  const playlistData = fileList.playlist;
  fileList.playlist = playlistData.filter((resp) => { return resp.filename !== req.params["filename"] });
  fs.writeFileSync(dataPath, JSON.stringify(fileList, null, 2));
  fs.unlinkSync(folderName + req.params["filename"]);
  res.send(fileList);
});

const server = app.listen(port, function () {
  console.log("Listening on port %s...", port);
});