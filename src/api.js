import MongoClient, { ObjectId } from 'mongodb'
import _ from 'lodash'
import { removeAllListeners } from 'nodemon'
import fs from 'fs';

const NUMBER_NEWEST = 20;
const NUMBER_RAND = 10;
let currentSongQueues = [];

const api = (mongoUrl) => {
    //constructor(mongoUrl){
        let musicDb
        MongoClient.connect(mongoUrl, function(err,db){
            if(err){
                console.log(`error connecting to mongo ${mongoUrl}:${JSON.stringify(err)}`)
            }
            musicDb = db.db("music")
        })
    //}

    const _randomizeArray = (arr) => {
        arr.forEach(e => {
            e["_randkey"] = Math.random()
        });
    
        const retval = _.sortBy(arr,'_randkey')
        return retval.map(s=> {
            delete s._randkey
            return s
        })
    }

    let validPlayList = (pl) => {
        if(pl.name===undefined || pl.entries===undefined) { return false;}
        if(!Array.isArray(pl.entries)) { return false;}
        let isValid = true;
        pl.entries.forEach( e => {
            if(e.key===undefined || e.type===undefined || e.title===undefined ) { isValid = false; return false;}
            if( e.key != parseInt(e.key,10)) { isValid = false; return false;}
            if( e.type.toLowerCase() != "song" && e.type.toLowerCase() != "album" && e.type.toLowerCase() != "artist") {isValid = false; return false;}
        });
        return isValid;
    };

    const _songExpansion = async (queryParms, includeArtist, includeAlbum ) => {
        if(includeAlbum==="true"){
            queryParms.push({$lookup:{from:"albums", localField:"albumfk", foreignField:"_id", as:"album"}})
            if(includeArtist==="true"){
                queryParms.push({$lookup:{from:"artists", localField:"album.artistFk", foreignField:"_id", as:"artist"}})
            }
        }
        const songs = await musicDb.collection('songs').aggregate(queryParms).toArray()
        
        return songs.map(s=>{
            const {album, artist, ...base} = s
            return {...base,
                fullpath: (process.env.LINUX_DIR_FORMAT) ? base.fullpath.replace(/\\/g,'/') : undefined,
                artist: (artist && artist.length>0) ? artist[0].artist : undefined,
                nationality: (artist && artist.length>0) ? artist[0].nationality : undefined,
                dateOfInterest: (artist && artist.length>0) ? artist[0].dateOfInterest : undefined,
                artistFk : (album && album.length>0) ? album[0].artistFk : undefined,
                title : (album && album.length>0) ? album[0].title : undefined,
                releaseYear : (album && album.length>0) ? album[0].releaseYear : undefined,
                aquisitionYear : (album && album.length>0) ? album[0].aquisitionYear : undefined,
                downloaded : (album && album.length>0) ? album[0].downloaded : undefined,
            }
        })
    }  

    const _albumExpansion = async (queryParms, includeArtist, includeSongs) => {
        if(includeArtist === "true"){
            queryParms.push({$lookup:{from:"artists", localField:"artistFk", foreignField:"_id", as:"artist"}})
        }
        if(includeSongs === "true"){
            queryParms.push({$lookup:{from:"songs", localField:"_id", foreignField:"albumfk", as:"songs"}})
        }
        const albums = await musicDb.collection('albums').aggregate(queryParms).toArray()
        return albums.map(a=>{
            const {artist, ...base} = a
            return {...base,
                artist: (artist && artist.length>0) ? artist[0].artist : undefined,
                nationality: (artist && artist.length>0) ? artist[0].nationality : undefined,
                dateOfInterest: (artist && artist.length>0) ? artist[0].dateOfInterest : undefined
            }
        })
    }

    const _artistExpansion = async (queryParms, includeAlbums, includeSongs) => {
        if(includeAlbums === "true"){
            queryParms.push({$lookup:{from:"albums", localField:"_id", foreignField:"artistFk", as:"albums"}})
            if(includeSongs === "true"){
                queryParms.push({$lookup:{from:"songs", localField:"albums._id", foreignField:"albumfk", as:"songs"}})
            }
        }
        const artists = await musicDb.collection('artists').aggregate(queryParms).toArray()
        return artists.map(a=>{
            const {albums, songs, ...base} = a
            return{ ...base,
                albums : (albums) ? _.sortBy(albums,"releaseYear").map(alb=>{
                    return {...alb,
                        songs: (songs) ? songs.slice().filter(s=> s.albumfk === alb._id) : undefined
                    }
                }) : undefined
            }
        })
    }

    const _writePlaylist = () => {
        const fileName = `/home/node/app/playlist${new Date().toISOString().replace(/:/g,'_')}.json`
        playlists().then(plData=>{
            //const plData = p.map(pl=>`${JSON.stringify(pl)},`)
            const backupFile = fs.writeFileSync(fileName, JSON.stringify(plData))
        })
    }

    const songQuery = async (parameter, includeArtist, includeAlbum) => {
        const matchParms = [{'$match': (parameter) ? parameter : {}}]
        return _songExpansion(matchParms,includeArtist, includeAlbum)
    }  

    const albumQuery = async (parameter, includeArtist, includeSongs) => {
        const matchParms = [{'$match': (parameter) ? parameter : {}}]
        return _albumExpansion(matchParms,includeArtist,includeSongs)
    }

    const artistQuery = async (parameter, includeAlbums, includeSongs, randomize) => {
        const matchParms = [{'$match': (parameter) ? parameter : {}}]
        const returnValue =  await _artistExpansion(matchParms, includeAlbums, includeSongs)
        if(randomize){
            return _randomizeArray(returnValue)
        }
        else{
            return returnValue
        }
    }

    const artistCount = async() => {
        return await musicDb.collection('artists').count({})
    }

    const albumCount = async() => {
        return await musicDb.collection('albums').count({})
    }

    const songCount = async() => {
        return await musicDb.collection('songs').count({})
    }

    const randomArtist = async (count) => {
        const queryParms = [{ $sample: { size: count } }]
        return await _artistExpansion(queryParms, "true", "true")
    }

    const randomAlbum = async (count) => {
        const queryParms = [{ $sample: { size: count } }]
        return await _albumExpansion(queryParms, "true", "true")
    }

    const randomSong = async (count) => {
        const queryParms = [{ $sample: { size: count } }]
        return await _songExpansion(queryParms, "true", "true")
    }

    const playlists = async () => {
        return await musicDb.collection('playlists').aggregate({}).sort({"name": 1}).toArray()
    }

    const getPlaylistItem = async (entry) => {
        switch(entry.type) {
            case "song":
                const song = await musicDb.collection('songs').findOne({_id: entry.key})
                return {...entry, songCount:1, sizeInMb: song.sizeInMb}
            case "album":
                const album = await musicDb.collection('albums').findOne({_id: entry.key})
                return {...entry, songCount:album.songCount, sizeInMb: album.sizeInMb}
            case "artist":
                const artist = await musicDb.collection('artists').findOne({_id: entry.key})
                return {...entry, songCount:artist.songCount, sizeInMb: artist.sizeInMb}
        }
    }

    const getPlaylist = async (id) => {
        const retVal = await musicDb.collection('playlists').findOne({ _id : id})
        const newItems = await Promise.all(retVal.entries.map(e=>getPlaylistItem(e)))
        return {...retVal, entries:newItems} 
    }

    const _makeId = () => {
        let ID = "";
        let characters = "abcdef0123456789";
        for ( var i = 0; i < 24; i++ ) {
          ID += characters.charAt(Math.floor(Math.random() * 16));
        }
        return ID;
      }

    const updatePlaylist = async (playlist) => {
        try{
            if(!validPlayList(playlist)){ return -2;} else{
            const val = await musicDb.collection('playlists').update(
                {
                    name: playlist.name,
                    _id: playlist._id || _makeId()
                },
                playlist,
                {upsert: true}
                )
            _writePlaylist();
            return 1;
        }
        }
        catch(e){
            return -1;
        }
    }

    const playlistToSongs = async (id) => {
        //try{
            let returnVal = [];
            return musicDb.collection('playlists').findOne({ _id : id})
            .then( async playlist=>{
                if(playlist === null){
                    return -1;
                }
                returnVal = await Promise.all(
                    playlist.entries.map( e =>{
                    switch(e.type){
                        case "song":
                             return _songExpansion([{'$match': {_id: e.key}}], "true", "true").then(song=> song)
                        case "album":
                            return _albumExpansion([{'$match': {_id: e.key}}], "true", "true").then(album => album[0].songs.map(s=>{
                                return {...s,
                                    artist: album[0].artist,
                                    nationality: album[0].nationality,
                                    dateOfInterest: album[0].dateOfInterest,
                                    artistFk: album[0].artistFk,
                                    title: album[0].title,
                                    releaseYear: album[0].releaseYear,
                                    aquisitionYear: album[0].aquisitionYear,
                                    downloaded: album[0].downloaded
                                }
                            }))
                        case "artist":
                            return _artistExpansion([{'$match': {_id: e.key}}], "true", "true").then(artist=>{
                                let fv=[]
                                artist[0].albums.forEach(a=>{
                                    fv = [...fv, ...a.songs.map(s=>{
                                        return {...s,
                                            artist: artist[0].artist,
                                            nationality: artist[0].nationality,
                                            dateOfInterest: artist[0].dateOfInterest,
                                            artistFk: a.artistFk,
                                            title: a.title,
                                            releaseYear: a.releaseYear,
                                            aquisitionYear: a.aquisitionYear,
                                            downloaded: a.downloaded
                                        }

                                    })]
                                })
                                return fv
                            })
                    }
                    //console.log(JSON.stringify(fauxRet))
                    //return fauxRet
                })
            )
            return _(returnVal).flatMap(a=>[...a])
            })
       // }catch(error){
       //     console.log(`ERROR in playlistToSongs: ${JSON.stringify(error)}`)
       //     return -5;
       // }
    }

    const stats = async (id) => {
        const sizeInMb =  await musicDb.collection('songs')
            .aggregate([{ $group:{ _id:null, "total": {$sum: "$sizeInMb" }}}])
            .toArray()

        const newestAlbums = await _albumExpansion([
                {"$match":{}},
                {"$lookup":{"from":"artists","localField":"artistFk","foreignField":"_id","as":"artist"}},
                {"$sort": {"added":-1}},
                {"$limit":NUMBER_NEWEST}
            ],"true","true")
        const randomAlbums = await randomAlbum(NUMBER_RAND)    
        return {
            artistCount: await musicDb.collection('artists').countDocuments({}),
            albumCount: await musicDb.collection('albums').countDocuments({}),
            songCount: await musicDb.collection('songs').countDocuments({}),
            sizeInMb: sizeInMb[0].total,
            newestAlbums,
            randomAlbums,
        }
    }

    const findSongQueues = (ip) => {
        return currentSongQueues.find((q)=>{
            return q.ipAddress.localeCompare(ip) == 0;
        });
    };

    const serveSongFromPlaylist = async (playlistId, ip) =>{
        //see if there is a queue for this ip already
        let newPlaylist = [];
        let songq = findSongQueues(ip);
        //console.log(`...songq after find is ${JSON.stringify(songq)}`);
        if(songq==undefined || playlistId!=songq.playlist){
            newPlaylist = [...await playlistToSongs(playlistId)];
        } else{
            newPlaylist = songq.list;
            if (newPlaylist.length == 0){
                newPlaylist = [ ...await playlistToSongs(playlistId)];
            }
        }

        if(Array.isArray(newPlaylist)){
            //console.log(`...newplaylist is now ${JSON.stringify(newPlaylist.length)} items long`);
        } else {
            //console.log(`...newplaylist is not an array`)
            const asArray = [...newPlaylist]
            //console.log(`...converted> ${asArray.length}`)
        }

        currentSongQueues = currentSongQueues.filter(q => q!=songq);
        //console.log(`...after removing songq from master list, its ${JSON.stringify(currentSongQueues.length)} long`);
        let song = newPlaylist[_.random(0,newPlaylist.length-1)];
        //console.log(`...song is ${JSON.stringify(song)}`);
        newPlaylist= newPlaylist.filter(s => s!=song);
        currentSongQueues.push({
            ipAddress: ip,
            playlist: playlistId,
            list: newPlaylist
        });
        //console.log(`...and finally currentSongQueue is now ${JSON.stringify(currentSongQueues)}`);
        //console.log(' ')
        //console.log(`returning ${JSON.stringify(song)}`)
        return [song];
    }

    const statisticalQuery = async (category) => {
        const albums = await _albumExpansion([],"true","false")
        return albums.reduce((agg, a)=>{
            const key = a[category]
            if(agg.has(key)){
              let entry = agg.get(key)
              entry.albums.push({title: `${a.title} by ${a.artist}`, _id: a._id, songCount: a.songCount})
              if( !entry.artists.map(a=>{return a._id}).includes(a.artistFk)){ entry.artists.push({artist: a.artist, _id: a.artistFk})}
            }else{
              agg.set (key, {
                albums: [{title: `${a.title} by ${a.artist}`, _id: a._id, songCount: a.songCount}],
                artists: [{artist: a.artist, _id: a.artistFk}]
              })
            }
            return agg
          }, new Map()) 
    }

    return {
        albumQuery,
        artistQuery,
        songQuery,
        artistCount,
        albumCount,
        songCount,
        randomArtist,
        randomAlbum,
        randomSong,
        playlists,
        getPlaylist,
        updatePlaylist,
        playlistToSongs,
        stats,
        serveSongFromPlaylist,
        statisticalQuery,
    }
}

export default api;

/*
import albums from './data/Albums.json';
import artists from './data/Artists.json';
import songs from './data/Songs.json';
import listeningList from './data/ListeningList.json';
import _ from 'lodash';
import fs from 'fs';

let aggQuery = (collection, col, stats) => {
    let returnVal = [];
    collection.forEach( (item)=>{
        let aggNdx = _.findIndex(returnVal, { tag : item[col] });
        if (aggNdx == -1){
            let newItem = { tag:   item[col], count: 1 };
            if(stats != undefined){
                for(let i=0;i<stats.length;i++)
                    newItem[stats[i]] = item[stats[i]];
            }
            returnVal.push(newItem);
        }
        else{
            returnVal[aggNdx].count++;
            if(stats != undefined){
                for(let i=0;i<stats.length;i++)
                    returnVal[aggNdx][stats[i]] += item[stats[i]];
            }
        }
    });
    return returnVal.sort((a,b) => {
        if(a.tag<b.tag){return -1;}
        if(a.tag>b.tag){return 1;}
        return 0;
    });
}

let writeListeningList = () => {
    let list = listeningList.map((item)=>{
        return `{ "type":"${item.type}", "key": ${item.key} }`
    })

    fs.writeFile('./data/ListeningList.json', '[' + list + ']', (err)=>{
        if(err) {
            return console.log('error writing listening list->' + err);
        }
        console.log("The listening list file was saved!");
})};

let getNextId = (collection) => {
    let returnValue = 1;
    collection.forEach( (item) =>{
        if(item._id>=returnValue) {returnValue = item._id + 1;}
    })
    return returnValue;
}

let convertColumn = (obj, colName, parseFunct) =>{
    if(obj){
        if(obj[colName]){
            obj[colName] = (parseFunct(obj[colName]) != NaN) ? parseFunct(obj[colName]) : obj[colName];
        }
    }
    return obj;
};

let convertAlbum = (alb) => {
    if(alb){
        alb = convertColumn(alb,'_id',parseInt);
        alb = convertColumn(alb,'releaseYear',parseInt);
        alb = convertColumn(alb,'aquisitionYear',parseInt);
        alb = convertColumn(alb,'artistfk',parseInt);
        alb = convertColumn(alb,'songcount',parseInt);
        alb = convertColumn(alb,'dateOfInterest',parseInt);
        alb = convertColumn(alb,'sizeInMb',parseFloat);        
    }
    return alb;
}

let validAlbum = (alb) => {
    return (
        alb._id &&
        alb.title &&
        alb.releaseYear &&
        alb.aquisitionYear &&
        alb.downloaded &&
        alb.songcount &&
        alb.songs &&
        alb.artist &&
        alb.sizeInMb
    ); 
}

let convertArtist = (art) => {
    if( art) {
        art = convertColumn(art,'_id',parseInt);
        art = convertColumn(art,'albumCount',parseInt);
        art = convertColumn(art,'songCount',parseInt);
        art = convertColumn(art,'dateOfInterest',parseInt);
        art = convertColumn(art,'sizeInMb',parseFloat);        
    }
    return art;
}

let validArtist = (art) => {
    return (
        art.artist &&
        art.nationality &&
        art.dateOfInterest &&
        art.albumCount &&
        art.songCount &&
        art.sizeInMb &&
        art.albums 
    );
}



let songList = () => {
    return _.flatten(albums.map( a=>{
            return a.songs.map(s=>{
                return {
                    songName: s.songName,
                    title: a.title,
                    artist: a.artist,
                    albKey: a._id,
                    songPk: s.songPk
                }
            });
       }));
};


let collectionApi = {

    artistById: (id) => {
        return _.find(artists, {'_id' : id}) ;
    },
    deleteArtist: (id) => {
        let artKey = _.findIndex(artists, {'_id': id });
        if( artKey>0){
            artists[artKey].albums.forEach((a)=>{
                collectionApi.deleteAlbum(a.albumpk);
            });
            artists.splice(artKey,1)
            return 1;     
        } else
        {
            return -1;
        }
    },
    updateArtist: (artist) => {
        artist = convertArtist(artist);
        if(!validArtist(artist)){ return -2;}
        let artKey = _.findIndex(artists,{ _id: artist._id });
        if( artKey>0){
            artists[artKey].albums.forEach((a)=>{
                collectionApi.deleteAlbum(a._id);
            });
           artists.splice(artKey,1, artist)     
           artist.albums.forEach( (a)=>{
                collectionApi.addAlbum(a);
           });
           return 1;
        }else{
            return -1;
        }
    },
    addArtist: (artist) => {
        artist = convertArtist(artist);
        if(!validArtist(artist)){ return -2;}
        let artKey = _.findIndex(artists, {artist: artist.artist });
        if( artKey<0){
            artist._id = getNextId(artists);
            artists.push(artist);
            artist.albums.forEach( (a)=>{
                a.artist = artist.artist;
                collectionApi.addAlbum(a);
           });
           return 1;
        } else { return -1;}
    },
    albumById: (id) => {
        return  _.find(albums, {'_id' : id}) ;
    },
    deleteAlbum: (id) => {
        let albKey = _.findIndex(albums, {'_id': id });
        if( albKey>0){
            let artKey = _.findIndex(artists, {'_id': albums[albKey].artistfk})
            console.log(`..artist key on delete is ${artKey} wass trying to find ${albums[albKey].artistfk}`)
            if(artKey>0){
                let albInColkey = _.findIndex(artists[artKey].albums, {'albumpk': id});
                console.log(`..albInColkey key on delete is ${albInColkey}`)
                if(albInColkey>0){ artists[artKey].albums.splice(albInColkey,1)  };
            }
            albums.splice(albKey,1)     
            return 1;
        }else{
            return -1;
        }
    },
    updateAlbum: (album) => {
        if(!validAlbum(album)){ return -2;}
        let albKey = _.findIndex(albums,{artist: album.artist, title: album.title});
        console.log(`Album with title ${album.title} by ${album.artist} returned key ${albKey}`);
        if( albKey>=0){
            albums.splice(albKey,1);
            collectionApi.addAlbum(album);
            return 1;
        } else{return -1;}
    },
    addAlbum: (album) => {
        if(!validAlbum(album)){ return -2;}
        let albKey = _.findIndex(albums, {artist: album.artist, title: album.title });
        if( albKey<0){
            album._id = getNextId(albums);
            //get artist Info for consistency
            let art = collectionApi.artistQuery({artist: album.artist});
            if(art.length>0){
                album.artistfk = art[0]._id;
                album.nationality = art[0].nationality;
                album.dateOfInterest = art[0].dateOfInterest;
                albums.push(album);
                let albNdx = _.findIndex(art[0].albums, {title: album.title });
                let nestedAlbum = {
                    'albumpk': album._id,
                    'title': album.title,
                    'releaseYear': album.releaseYear,
                    'aquisitionYear': album.aquisitionYear,
                    'downloaded': album.downloaded,
                    'songcount': album.songcount,
                    'songs': album.songs
                    };
                if(albNdx>=0){art[0].albums.splice(albNdx,1,nestedAlbum);}
                else{ art[0].albums.push(nestedAlbum);
                }
                return 1;
            } else{
                return -3; // could not find the artist
            }
        } else
        {
            return -1; // album exists already
        }
    },
,
    removeFromListeningList: (type, id) => {
        console.log(`type is ${type} and id is ${id}`)
        if( parseInt(id)===NaN){ return -2;}
        try{
        _.remove(listeningList, {
            type: type,
            key: parseInt(id)
        });
        return 1;
    }
    catch(e){ 
        console.log(`error occured in removeFromListeningList ${e.message}`);
        return -1;
    }

    },
    getListeningList: () => {
        let returnValue = [];
        listeningList.forEach((item) =>{
            returnValue.push( (item.type=='album') ? collectionApi.albumById(item.key) : collectionApi.artistById(item.key));
        });
        return returnValue;
        
    },

    albumCount : albums.length,
    artistCount: artists.length,
    artistQuery: (matchingObject, sortColumns, sortOrders) => {
        return _.orderBy(_.filter(artists, convertArtist(matchingObject)),sortColumns,sortOrders)
    },
    albumQuery: (matchingObject, sortColumns, sortOrders) => {
        return _.orderBy(_.filter(albums, matchingObject),sortColumns,sortOrders)
    },
    ,
    artistAggByQuery: (col) => {
        return aggQuery(artists, col,  ['songCount','sizeInMb', 'albumCount']);
    },
    albumAggByQuery: (col) => {
        return aggQuery(albums, col, ['songcount','sizeInMb']);
    },
    songQuery: (searchPattern) => {
        return _.filter(songList(),(e)=>{
            return e.songTitle.toLowerCase().indexOf(searchPattern.toLowerCase()) !== -1;
        });
    },
    albumTitleQuery: (searchPattern) => {
        return _.filter(albums,(e)=>{
            return e.title.toLowerCase().indexOf(searchPattern.toLowerCase()) !== -1;
        });
    },
    artistNameQuery: (searchPattern) => {
        return _.filter(artists,(e)=>{
            return e.artist.toLowerCase().indexOf(searchPattern.toLowerCase()) !== -1;
        });
    },
    songById: (id) => {
        return _.filter(songs,(e) => {
            return e.songPk == id;
        })
    }
};


export {collectionApi};
*/
