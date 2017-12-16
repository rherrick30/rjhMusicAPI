import albums from './data/Albums.json';
import artists from './data/Artists.json';
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

let validListeningListItem = (lli) => {
    return (lli._id && lli.artist);
}

let songList = () => {
    return _.flatten(albums.map( a=>{
            return a.songs.map(s=>{
                return {
                    songTitle: s.songName,
                    title: a.title,
                    artist: a.artist,
                    albKey: a._id,
                    songPk: s.songPk
                }
            });
       }));
};


/*
TO DO:

4) Tagging! 
5) Add filter to aggregated query

*/

let collectionApi = {

    /* RESTful methods */
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
    addToListeningList: (item) => {
        try{

            if(!validListeningListItem(item)){ return -2;}

            let newEntry = {
                type: ((item.title) ? 'album' : 'artist'),
                key: item._id
            };
            
            if (!_.find(listeningList, newEntry)){
                listeningList.push(newEntry);
                writeListeningList();
                return 1;
            }
            else{ return -3;}
        }
        catch(e){ 
            console.log(`error occured in addToListeningList ${e.message}`);
            return -1;
        }
        
    },
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

    /* other methods */
    albumCount : albums.length,
    artistCount: artists.length,
    artistQuery: (matchingObject, sortColumns, sortOrders) => {
        return _.orderBy(_.filter(artists, convertArtist(matchingObject)),sortColumns,sortOrders)
    },
    albumQuery: (matchingObject, sortColumns, sortOrders) => {
        return _.orderBy(_.filter(albums, matchingObject),sortColumns,sortOrders)
    },
    randomArtist: () => {
        return artists[_.random(0,artists.length-1)];
    },
    randomAlbum: () => {
        return albums[_.random(0,albums.length-1)];
    },
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
    }

};


export {collectionApi};

