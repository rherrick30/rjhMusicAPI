import {collectionApi} from './api.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';

require('dotenv').config()

let albumValidationMessage = (alb) => {
  return 'errors: '+
  ((alb._id) ? '' : ' missing _id' )+
  ((alb.title) ? '' : ' missing title' )+
  ((alb.releaseYear) ? '' : ' missing releaseYear' )+
  ((alb.aquisitionYear) ? '' : ' missing aquisitionYear' )+
  ((alb.downloaded) ? '' : ' missing downloaded' )+
  ((alb.songcount) ? '' : ' missing songcount') +
  ((alb.songs) ? '' : ' missing songs' )+
  ((alb.artist) ? '' : ' missing artist' )+
  ((alb.sizeInMb) ? '' : ' missing sizeInMb') ;
};


let artistValidationMessage = (art) => {
  return 'errors: '+
  ((art.artist) ? '' : ' missing artist' )+
  ((art.nationality) ? '' : ' missing nationality' )+
  ((art.dateOfInterest) ? '' : ' missing dateOfInterest' )+
  ((art.albumCount) ? '' : ' missing albumCount' )+
  ((art.songCount) ? '' : ' missing songCount' )+
  ((art.albums) ? '' : ' missing albums collection') +
  ((art.sizeInMb) ? '' : ' missing sizeInMb') ;
};

const app = express();
app.use(cors());


// different parsers depending upon the caller.  Axois like Json, jQuery like urlEncoding
//let requestBodyParser = bodyParser.urlencoded({ extended: false })
let requestBodyParser = bodyParser.json();


app.get('/', function (req, res) {
  res.send('Hello World!')
});

app.get('/albums', function(req, res){
    res.send( collectionApi.albumQuery());
});


app.get('/album/:albumKey', (req,res)=>{
    console.log(`got a request for albumKey ${req.params.albumKey}`);
    res.send(collectionApi.albumById( parseInt(req.params.albumKey)));
})

app.delete('/album/:albumkey', requestBodyParser, (req, res) =>{
  console.log(`delete request for albumKey ${req.params.albumkey}`);
  let resultCode = collectionApi.deleteAlbum(parseInt(req.params.albumkey));
  switch(resultCode){
      case -1:
        res.status(304).send(`Album key ${req.params.albumkey} not found`);
        break;
      case 1:
        res.send(`Album key ${req.params.albumkey} deleted.`);
        break;
      default:
        res.status(500).send('An internal error has occured.');
  }
})

app.post('/album',requestBodyParser, (req, res) =>{
  console.log(`got a album post request for ${req.body.title}`);
  let resultCode = collectionApi.addAlbum(req.body);
  switch(resultCode){
    case -1:
      res.status(304).send(`Album already exists`);
      break;
    case -2:  
      let errors = albumValidationMessage(req.body);
      res.status(400).send(`Album object was malformed or missing data ${errors}`);
      break;
    case -3:
      res.status(400).send(`Artist not found`);
      break;
    case 1:
      res.send(`Album added`);
      break;
    default:
      res.status(500).send('An internal error has occured.');
  }
});

app.put('/album',requestBodyParser, (req, res) => {
  console.log(`got an album put request for ${req.body._id}`);
  let resultCode = collectionApi.updateAlbum(req.body);
  switch(resultCode){
    case -1:
      res.status(400).send(`Album not found`);
      break;
    case -2:  
      let errors = albumValidationMessage(req.body);
      res.status(400).send(`Album object was malformed or missing data ${errors}`);
      break;
    case -3:
      res.status(400).send(`Artist not found`);
      break;
    case 1:
      res.send(`Album updated`);
      break;
    default:
      res.status(500).send('An internal error has occured.');
  }
});


app.get('/artists', function(req, res){
  res.send( collectionApi.artistQuery());
});


app.get('/artist/:artistKey', (req,res)=>{
  console.log(`got a request for artistKey ${req.params.artistKey}`);
  res.send(collectionApi.artistById( parseInt(req.params.artistKey)));
})

app.delete('/artist/:artistkey', requestBodyParser, (req, res) =>{
console.log(`delete request for artist id ${req.params.artistkey}`);
let resultCode = collectionApi.deleteArtist(parseInt(req.params.artistkey));
switch(resultCode){
    case -1:
      res.status(304).send(`Artist key ${req.params.artistkey} not found`);
      break;
    case 1:
      res.send(`Artist key ${req.params.artistkey} deleted.`);
      break;
    default:
      res.status(500).send('An internal error has occured.');
}
})

app.post('/artist', requestBodyParser, (req, res) =>{
console.log(`got an artist post request for ${req.body.artist}`);
let resultCode = collectionApi.addArtist(req.body);
switch(resultCode){
  case -1:
    res.status(304).send(`Artist already exists`);
    break;
  case -2:  
    let errors = artistValidationMessage(req.body);
    res.status(400).send(`Artist object was malformed or missing data ${errors}`);
    break;
  case 1:
    res.send(`Artist added`);
    break;
  default:
    res.status(500).send('An internal error has occured.');
}
});

app.put('/artist', requestBodyParser, (req, res) => {
console.log(`got a artist put request for ${req.body._id}`);
let resultCode = collectionApi.updateArtist(req.body);
switch(resultCode){
  case -1:
    res.status(400).send(`Artist not found`);
    break;
  case -2:  
    let errors = artistValidationMessage(req.body);
    res.status(400).send(`Artist object was malformed or missing data ${errors}`);
    break;
  case -3:
    res.status(400).send(`Artist not found`);
    break;
  case 1:
    res.send(`Artist updated`);
    break;
  default:
    res.status(500).send('An internal error has occured.');
}
});


app.get('/listeningList', (req, res)=>{
  res.send(collectionApi.getListeningList());
});

app.post('/listeningList', requestBodyParser, (req, res)=>{
  let resultCode = collectionApi.addToListeningList(req.body);
  switch(resultCode){
    case -1:
      res.status(500).send(`An internal error has occured.`);
      break;
    case -2:  
      res.status(400).send(`ListeningList object was malformed or missing data`);
      break;
    case -3:  
    res.status(304).send(`ListeningList object already exists`);
    break;
  case 1:
      res.send(`Updated`);
      break;
    default:
      res.status(500).send('An internal error has occured.');
  }
  
});

app.delete('/listeningList/:type/:id',requestBodyParser,  (req, res)=>{
  let resultCode = collectionApi.removeFromListeningList(req.params.type,req.params.id);
  switch(resultCode){
    case -1:
      res.status(500).send(`An internal error has occured.`);
      break;
    case -2:  
      let errors = artistValidationMessage(req.body);
      res.status(400).send(`ListeningList object was malformed or missing data`);
      break;
    case 1:
      res.send(`Updated`);
      break;
    default:
      res.status(500).send('An internal error has occured.');
  }
  });


/*  NON RESTful ENDPOINTS (For enhanced querying) */

app.get('/albumCount', (req, res)=>{
  res.send( { albumCount: collectionApi.albumCount});
}); 

app.get('/artistCount', (req, res)=>{
  res.send( { artistCount: collectionApi.artistCount});
}); 

app.post('/albumQuery', requestBodyParser,(req,res)=>{
  console.log(`query options are ${JSON.stringify(req.body)}`);
  res.send(collectionApi.albumQuery(req.body));
});

app.post('/artistQuery', requestBodyParser,(req, res)=>{
    res.send(collectionApi.artistQuery(req.body));
});

app.get('/randomAlbum', (req, res)=>{
  res.send( [ collectionApi.randomAlbum()]);
});

app.get('/randomArtist', (req, res)=>{
  res.send([collectionApi.randomArtist()]);
});

app.get('/randomSong', (req, res) => {
  res.send([collectionApi.randomSong()]);
});

app.post('/albumAggQuery',requestBodyParser, (req, res)=>{
  
  if(!req.body.column){
    res.status(400).send('Body was malformed.  Should be a Json document with a "column" entry.');
  }
  res.send(collectionApi.albumAggByQuery(req.body.column));
})

app.post('/artistAggQuery', requestBodyParser, (req, res)=>{
  console.log(`body is ${JSON.stringify(req.body, null, 2)}`)
  if(!req.body.column){
    res.status(400).end('Body was malformed.  Should be a Json document with a "column" entry.');
    return;
  }
  res.send(collectionApi.artistAggByQuery(req.body.column));
})

app.get('/songSearch/:searchPattern', (req,res)=>{
  res.send(collectionApi.songQuery(req.params.searchPattern));
});

app.get('/albumSearch/:searchPattern', (req,res)=>{
  res.send(collectionApi.albumTitleQuery(req.params.searchPattern));
});

app.get('/artistSearch/:searchPattern', (req,res)=>{
  res.send(collectionApi.artistNameQuery(req.params.searchPattern));
});

app.get('/song/:id', (req, res)=>{
  if (process.env.MUSIC_HOME_FOLDER === undefined){
    res.status(501).end("Sorry, Music streaming is not available on this instance");
  }
  const song = collectionApi.songById(req.params.id);
  if(song.length!=1)
  {
    console.log(`song ${req.params.id} not found`)
    res.status(500).end(`Could not retreve song with key ${req.params.id}`);
  }



  const path = process.env.MUSIC_HOME_FOLDER + song[0].fullpath
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range

  console.log(`song ${req.params.id} was found and has length ${fileSize}`)


  if (range) {
    const parts = range.replace(/bytes=/, "").split("-")
    const start = parseInt(parts[0], 10)
    const end = parts[1] 
      ? parseInt(parts[1], 10)
      : fileSize-1
    const chunksize = (end-start)+1
    const file = fs.createReadStream(path, {start, end})
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mp3',
    }

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mp3',
    }
    res.writeHead(200, head)
    fs.createReadStream(path).pipe(res)
  }
});

app.listen(3001, function () {
  console.log('Example app listening on port 3001!')
});

