import {collectionApi} from './api.js'
import _ from 'lodash';

/*

console.log(`There are ${collectionApi.albumCount} albums and ${collectionApi.artistCount} artists in my collection`);

collectionApi.artistQuery( {'nationality':'UK', 'dateOfInterest': 2001},['artist'],['desc']).forEach( (a) =>{
    console.log(a.artist);
}); 

console.log('');
console.log('random albums');
for(let i=0;i<10;i++){
    let a = collectionApi.randomAlbum();   
    console.log(`...${a.title} by ${a.artist}`);
}

console.log('random artists');
for(let i=0;i<10;i++){
    let a = collectionApi.randomArtist();   
    console.log(`...${a.artist}`);
}


printArtist(collectionApi.artistById(800));
printAlbum(collectionApi.albumById(2285));


collectionApi.artistQuery( {'nationality':'UK', 'dateOfInterest': 2001}).forEach( (a) =>{
    console.log(a.artist);
}); 

collectionApi.artistQuery( (a) => { return a.nationality==='UK' && a.dateOfInterest<=1980}).forEach( (a) =>{
    console.log(a.artist);
}); 

collectionApi.albumQuery( {'aquisitionYear':2017}).forEach( (a) =>{
    console.log(`${a.title} by ${a.artist}`);
}); 




let column = 'nationality'

console.log('');
console.log('Artist aggregation by ', column);

collectionApi.artistAggByQuery(column).forEach((agg)=>{
    console.log(`...${agg.tag} count=${agg.count} albums=${agg.albumCount} songs=${agg.songCount} size=${agg.sizeInMb}`);
});


column = 'releaseYear'
console.log('');
console.log('Album aggregation by ', column);
collectionApi.albumAggByQuery(column).forEach((agg)=>{
    console.log(`...${agg.tag} count=${agg.count} songs=${agg.songcount} size=${agg.sizeInMb}`);
});

let a = collectionApi.albumById(435);
collectionApi.addToListeningList(a);



console.log('before');
let x = collectionApi.getListeningList();
x.forEach((item)=>{
    console.log(item.artist + ' ' + ((item.title) ? item.title : '') );
});


collectionApi.removeFromListeningList(x[0]);
console.log('after');

x = collectionApi.getListeningList()
x.forEach((item)=>{
    console.log(item.artist + ' ' + ((item.title) ? item.title : '') );
});

console.log(`polcari bobs key is ${items[0]._id}`);





console.log('updating nationality and updating in database')

items[0].nationality='MNH';
collectionApi.updateArtist(items[0]);
let polcari = collectionApi.artistById(key);
printArtist(polcari);


collectionApi.addAlbum(newAlb);
items = null;

items[0].aquisitionYear = 1999;

collectionApi.updateAlbum(items[0]);
let polcariAlb = collectionApi.albumById(items[0]._id);
printAlbum(polcariAlb);


collectionApi.deleteAlbum(items[0]._id);
items = collectionApi.albumQuery( {artist:"Polcari Bob", title: "Polcari Bob's Chicken Parm"});
if(items.length==0) {
    console.log('couldnt find polcari bob album!');
}
else{
    console.log('album is still there');
}


collectionApi.deleteArtist(key);
items = null;
items = collectionApi.artistQuery( {artist: 'Polcari Bob'});
if(items.length==0) {
    console.log('couldnt find polcari bob!');
}
else{
    console.log('still there');
    items.forEach((elem)=>{
        console.log(`   ${elem.artist}..${elem._id}`);
    });
}


console.log('')
console.log('')
console.log('album test')
polcariAlb = collectionApi.albumById(32);
console.log(polcariAlb);
//printAlbum(polcariAlb);


let printArtist = (a) => {
    //console.log(`${a.artist} is from ${a.nationality}.  Ive been a fan since ${a.dateOfInterest} I have ${a.albumCount} albums and ${a.songCount} songs of his/hers/theirs.`);
    console.log(`${a.artist} has a key of ${a._id}`);
    a.albums.forEach( (element) => {
        console.log(`...${element.title} (${element.albumpk}) has aquisitionYr=${element.aquisitionYear}`);
        element.songs.forEach((s)=>{console.log(`......${s}`)});
    });
}

let printAlbum = (a) => {
    //console.log(`${a.title} by ${a.artist} was released in ${a.releaseYear} I bought it in ${a.aquisitionYear} and I ${ (a.downloaded) ? 'downloaded this album.' : 'have a physical copy' } it has ${a.songcount} songs`);
    console.log(`${a.title} by ${a.artist} has key of ${a._id}  has aquisitionYr=${a.aquisitionYear}`);
    a.songs.forEach((s)=>{console.log(`...${s}`)});
}


let printCollex = () =>{
    let items = collectionApi.artistQuery( {artist: 'Polcari Bob'});
    if(items.length==0) {
        console.log('couldnt find polcari bob artist!');
    }
    else{
        printArtist(items[0]);
    }
    items = collectionApi.albumQuery( {artist:"Polcari Bob"});
    if(items.length==0) {
        console.log('couldnt find polcari bob album!');
    }
    else{
        items.forEach((a)=>{printAlbum(a)});
    }
    

}


let newArt = { "_id":-1 , "artist":"Polcari Bob", "nationality":"Italy", "dateOfInterest":2017, "albumCount":1, "songCount":3, "sizeInMb":7.1023712158203, "albums": [{ "albumpk":-1, "title":"Jagged Little Thing", "releaseYear":2017, "aquisitionYear":2017, "downloaded":false, "songcount":3, "songs":["01 - All I Really Want is a plate of pasta.mp3","02 - You Oughta Know how hungry I am.mp3","03 - Perfect veal piccata.mp3"]}]}
collectionApi.addArtist(newArt);
let artistKey = -1;
let items = collectionApi.artistQuery( {artist: 'Polcari Bob'});
if(items.length>0) {
    artistKey=items[0]._id;
}
let newAlb = { "_id":-1, "title":"Polcari Bob's Chicken Parm", "releaseYear":2017, "aquisitionYear":2017, "downloaded":true, "songcount":1, "songs":["Gotz to use the mozarella.mp3"], "artistfk":artistKey, "artist":"Polcari Bob", "nationality":"MA", "dateOfInterest":2017, "sizeInMb":84.2325601577759 }
collectionApi.addAlbum(newAlb);

console.log('added an artist and an album....')
printCollex();

items = collectionApi.albumQuery( {artist:"Polcari Bob", title: "Polcari Bob's Chicken Parm"});
let albumKey = -1;
if(items.length>0){albumKey=items[0]._id}


console.log('');
console.log('...updating the album');
newAlb.aquisitionYear = 1979;
collectionApi.updateAlbum(newAlb);
printCollex();


console.log('');
console.log('...deleting the album');
collectionApi.deleteAlbum(albumKey);
printCollex();


console.log('');
console.log('...deleting the artist');
collectionApi.deleteArtist(artistKey);
printCollex();




let newArt = { "_id":-1 , "artist":"Polcari Bob", "nationality":"Italy", "dateOfInterest":2017, "albumCount":1, "songCount":3, "sizeInMb":7.1023712158203, "albums": [{ "albumpk":-1, "title":"Jagged Little Thing", "releaseYear":2017, "aquisitionYear":2017, "downloaded":false, "songcount":3, "songs":["01 - All I Really Want is a plate of pasta.mp3","02 - You Oughta Know how hungry I am.mp3","03 - Perfect veal piccata.mp3"]}]}
let newAlb = { "_id":-1, "title":"Polcari Bob's Chicken Parm", "releaseYear":2017, "aquisitionYear":2017, "downloaded":true, "songcount":1, "songs":["Gotz to use the mozarella.mp3"], "artist":"Polcari Bob", "nationality":"MA", "dateOfInterest":2017, "sizeInMb":84.2325601577759 }

let res = collectionApi.addArtist(newArt);
console.log(`result from artist op ${res}`);

res = collectionApi.addAlbum(newAlb);
console.log(`result from album op ${res}`);
res = collectionApi.addAlbum(newAlb);
console.log(`result from additional album add ${res}`);

newAlb = { "_id":-1, "title":"Polcari Bob's Chicken Parm", "releaseYear":2015, "aquisitionYear":2017, "downloaded":true, "songcount":1, "songs":["Gotz to use the mozarella.mp3"], "artist":"Polcari Bob", "nationality":"MA", "dateOfInterest":2017, "sizeInMb":84.2325601577759 }
res=collectionApi.updateAlbum(newAlb)
console.log(`result from good refresh ${res}`);

newAlb = { "_id":-1, "title":"Pol Bob's Chicken Parm", "releaseYear":2015, "aquisitionYear":2017, "downloaded":true, "songcount":1, "songs":["Gotz to use the mozarella.mp3"], "artist":"Polcari Bob", "nationality":"MA", "dateOfInterest":2017, "sizeInMb":84.2325601577759 }
res=collectionApi.updateAlbum(newAlb)
console.log(`result from bad refresh ${res}`);



let aSongs = [
    'Back in Black',
    'Black',
    'ameriblacksploitation',
    'not any color',
    'any colour you like',
    'black spring'
];


let searchPattern = 'Black';

_.filter(aSongs,(s)=>{
    return s.toLowerCase().indexOf(searchPattern.toLowerCase()) !== -1;
}).forEach(item =>{
    console.log(`...${item}`);
});



let songs = collectionApi.songQuery('void')
songs.forEach((e) => {
  console.log(`"${e.songTitle}"  by ${e.artist} in on album "${e.title}" `)  
});

console.log(`there were ${songs.length} items returned`);



let songs = collectionApi.albumTitleQuery('blue')
songs.forEach((e) => {
  console.log(`"${e.title}"  by ${e.artist}" `)  
});

console.log(`there were ${songs.length} items returned`);

*/

let songs = collectionApi.artistNameQuery('rob')
songs.forEach((e) => {
  console.log(`" ${e.artist}" `)  
});

console.log(`there were ${songs.length} items returned`);



/**/


