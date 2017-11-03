import {collectionApi} from './api.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';


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


let artistVerificationMessage = (art) => {
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
app.use(bodyParser.json());

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

app.delete('/album/:albumkey', (req, res) =>{
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

app.post('/album', (req, res) =>{
  console.log(`got a post request for ${req.body.artistfk}`);
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

app.put('/album', (req, res) => {
  console.log(`got a post request for ${req.body._id}`);
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

app.delete('/artist/:artistkey', (req, res) =>{
console.log(`delete request for artistkey ${req.params.artistkey}`);
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

app.post('/artist', (req, res) =>{
console.log(`got a post request for ${req.body.artistfk}`);
let resultCode = collectionApi.addArtist(req.body);
switch(resultCode){
  case -1:
    res.status(304).send(`Artist already exists`);
    break;
  case -2:  
    let errors = artistValidationMessage(req.body);
    res.status(400).send(`Artist object was malformed or missing data ${errors}`);
    break;
  case -3:
    res.status(400).send(`Artist not found`);
    break;
  case 1:
    res.send(`Artist added`);
    break;
  default:
    res.status(500).send('An internal error has occured.');
}
});

app.put('/artist', (req, res) => {
console.log(`got a post request for ${req.body._id}`);
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

app.post('/listeningList', (req, res)=>{
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

app.delete('/listeningList', (req, res)=>{
  let resultCode = collectionApi.removeFromListeningList(req.body);
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

app.post('/albumQuery', (req,res)=>{
  res.send(collectionApi.albumQuery(req.body));
});

app.post('/artistQuery', (req, res)=>{
    res.send(collectionApi.artistQuery(req.body));
});

app.get('/randomAlbum', (req, res)=>{
  res.send(collectionApi.randomAlbum());
});

app.get('/randomArtist', (req, res)=>{
  res.send(collectionApi.randomArtist());
});

app.post('/albumAggQuery',(req, res)=>{
  if(!req.body.column){
    res.status(400).send('Body was malformed.  Should be a Json document with a "column" entry.');
  }
  res.send(collectionApi.albumAggByQuery(req.body.column));
})

app.post('/artistAggQuery',(req, res)=>{
  if(!req.body.column){
    res.status(400).send('Body was malformed.  Should be a Json document with a "column" entry.');
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

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});

