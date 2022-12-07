//import {collectionApi} from './api.js';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import api from './api'
import 'regenerator-runtime/runtime'
import wlogger from './wlogger'


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
app.use(requestBodyParser);
let musicApi = api(process.env.MONGOURL)

app.get('/', function (req, res) {
  res.json({
    mesage:'Hello World!',
  })
});



app.get('/collectionstats', async(req,res)=>{
  const stats = await musicApi.stats()
  res.send(stats)
})


app.get('/artists', async (req,res)=>{
    try{
      const {includeAlbums, includeSongs, randomize} = req.query
      const artists = await musicApi.artistQuery({}, includeAlbums, includeSongs, randomize)
      res.json(artists)
    }catch(error){
      res.status(500).json({msg:"error", error})
    }
})

app.get('/albums', async (req,res)=>{
    try{
      const albums = await musicApi.albumQuery();
      res.json(albums);
    }catch(error){
      res.status(500).json({msg:"error", error})
    }
})

app.get('/songs', async (req,res)=>{
  try{
    const songs = await musicApi.songQuery()
    res.json(songs)
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.get('/artist/:artistKey', async (req,res)=>{
  try{
    const {includeAlbums, includeSongs} = req.query
    const [artist] = await musicApi.artistQuery({_id: req.params.artistKey},includeAlbums, includeSongs)
    res.json(artist);
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.get('/album/:albumKey', async (req,res)=>{
  try{
    const {includeArtist, includeSongs} = req.query
    const [album] = await musicApi.albumQuery({_id: req.params.albumKey}, includeArtist, includeSongs)
    res.json(album);
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.get('/song/:songKey', async (req, res)=>{
  try{
    const {includeArtist, includeAlbum} = req.query
    const [song] = await musicApi.songQuery({_id: req.params.songKey}, includeArtist, includeAlbum)
    res.json(song);
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.post('/artists',  async (req, res)=>{
  try{
    const {includeAlbums, includeSongs} = req.query
    const artists = await musicApi.artistQuery(req.body, includeAlbums, includeSongs)
    res.json(artists)
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.post('/albums', async (req,res)=>{
  try{
    const {includeArtist, includeSongs} = req.query
    const albums = await musicApi.albumQuery(req.body, includeArtist, includeSongs)
    res.json(albums)
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.post('/songs', async (req, res)=>{
  try{
    const {includeArtist, includeAlbum} = req.query
    const songs = await musicApi.songQuery(req.body, includeArtist, includeAlbum)
    res.json(songs)
  }catch(error){
    res.status(500).json({msg:"error", error})
  }
})

app.get('/songquery/:pattern', async (req, res)=>{
  const songs = await musicApi.songQuery({songName: {'$regex': req.params.pattern, '$options': 'i'}}, "true", "true")
  res.json(songs)
})

app.get('/albumquery/:pattern', async (req, res)=>{
  const albums = await musicApi.albumQuery({title: {'$regex': req.params.pattern, '$options': 'i'}}, "true", "true")
  res.json(albums)
})

app.get('/albumCount', async (req, res)=>{
  const albumCount = await musicApi.albumCount();
  res.send( { albumCount});
}); 

app.get('/artistCount', async (req, res)=>{
  const artistCount = await musicApi.artistCount();
  res.send( { artistCount});
}); 

app.get('/songCount', async (req, res)=>{
  const songCount = await musicApi.songCount();
  res.send( { songCount});
}); 

app.get('/randomSong/:playlist', async (req, res) => {
  const randomSong = await musicApi.serveSongFromPlaylist(req.params.playlist, req.ip)
  res.send(randomSong);
});

app.get('/randomSong', async (req, res) => {
  const {count} = req.query
  const randomSong = await musicApi.randomSong((isNaN(count)? 1 : parseInt(count)));
  res.send(randomSong);
});

app.get('/randomAlbum', async (req, res) => {
  const {count} = req.query
  const randomAlbum = await musicApi.randomAlbum((isNaN(count)? 1 : parseInt(count)));
  res.send(randomAlbum);
});

app.get('/randomArtist', async (req, res) => {
  const {count} = req.query
  const randomArtist = await musicApi.randomArtist((isNaN(count)? 1 : parseInt(count)));
  res.send(randomArtist);
});


app.get('/playsong/:id', async (req, res)=>{

  if (process.env.MUSIC_HOME_FOLDER === undefined){
    res.status(501).end("Sorry, Music streaming is not available on this instance");
  }
  const song = await musicApi.songQuery({_id: req.params.id}, "false", "false")
  if(song.length!=1)
  {
    wlogger.error(`song ${req.params.id} not found`)
    res.status(500).end(`Could not retreve song with key ${req.params.id}`);
  }



  const path = process.env.MUSIC_HOME_FOLDER + song[0].fullpath
  const stat = fs.statSync(path)
  const fileSize = stat.size
  const range = req.headers.range

  wlogger.info(`song ${req.params.id} was found and has length ${fileSize}`)


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


app.get('/checksongs', async (req, res)=>{
  const songList = await musicApi.songQuery({});
  const missing = []
  songList.forEach(s => {
    const path = process.env.MUSIC_HOME_FOLDER + s.fullpath
    if(!fs.existsSync(path)){
      missing.push(s.fullpath)
    }
  });
  res.json({missing})
})

app.get('/playlists', async (req, res)=>{
  const playlists = await musicApi.playlists()
  res.send(playlists)
});

app.get('/playlist/:id', async (req, res)=>{
  const playlist = await musicApi.getPlaylist(req.params.id);
  res.json(playlist);
})

app.post('/playlist', requestBodyParser, async (req, res)=>{
  let resultCode = await musicApi.updatePlaylist(req.body) 
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

app.get('/playlistsongs/:id', async (req, res)=>{
  const songList = await musicApi.playlistToSongs(req.params.id);
  if(songList === -1){
    res.status(500).send(`Playlist was not found`);
  }else if(songList<0){
    res.status(500).send(`A server error has occured`);
  }
  else{
    res.send(songList);
  }
});

app.post('/summary', async (req, res)=>{
  const results = await musicApi.statisticalQuery(req.body.category)
  res.json([...results].map(r=>{
    return {
      key: r[0],
      albums: r[1].albums,
      artists: r[1].artists,
    }
  }))
})

const port = process.env.PORT || 3001
const streamingPort = process.env.STREAMING_PORT || 3004

app.listen(port, requestBodyParser, function () {
  wlogger.info(`RJH MusicAPI listening on port ${port}!`)
});

// and here a second endpoint for streaming songs
const streamingApp = express();
streamingApp.use(cors());
streamingApp.use(requestBodyParser)

streamingApp.get('/', async (req, res) => {
  const batchSize = parseInt(process.env.STREAMING_BATCH_SIZE)
  const randomSong = await musicApi.randomSong(batchSize);
  res.send(randomSong);
});

streamingApp.listen(streamingPort, requestBodyParser, function(){
  wlogger.info(`Streaming application listening on part ${streamingPort}`)
})
