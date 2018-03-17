# rjhMusicAPI 

This Api is something I developed to manage my music collection.  I use it for experimentation with multiple different front end technologies (React, Angular, Android, etc).  I am thus using CORS to send the JSON information which, of course you would **never** ordinarily do in production (well, if you did, then you should use it with moderation!).  Also, I dont have any security on it (as yet) because for now I am more interested in doing interesting things than keeping the data safe.  This data is not the data of record, I keep that in a local SQL database and have a crawler which I wrote that scans for new music and uploads it.  I then have another local routine (written in C#, though I am porting it to Java) which creates the raw JSON files that fuel the API.

Its written in ES6, and I use Babel to transpile.  There is a job called 'server' which can be used to transpile and run the server.  Or the 'start' job runs it with a nodemon which is helpful while you are developing and debugging.  I also have a 'test' job that I have plans to eventually move to Mocha. 

So with that out of the way, here are the endpoints on this API.


## RESTful Endpoints 
These are endpoints that are the traditional endpoints which would be used in a RESTful application.

/albums (get)

/album/:albumKey (get)

/album/:albumKey (delete)

/album (post)

/album (put)


/artists (get)

/artist/:artistKey (get)

/artist/:artistKey (delete)

/artist (post)

/artist (put)


/listeningList (get)  -> a list of albums and artists that have been designated as being something ot listen to later.  Often I hear a song when I am in the middle of something, and decide I want to listen to it later when I have access to my mp3 player.  Hence the listening list! 

/listeningList (post) -> add either an album or an artist to the listing list.  The handler figures out which it is (album or artist) and adds it in.

/listeningList (delete) -> presumably after I have listened to it.


## Other Endpoints 
In addition to the REST endpoints, the API exposes some other endpoints that primarily facilitate querying.

/albumCount (get) -> when I want know how many I have without downloading the whole list

/artistCount (get) -> ditto.

/albumQuery (post)  -> Used to serach for albums with specific attributes.  The object posted has a key value pair with an attribute and a potential value.  For example ({'aquisitionYear':2017}).

/artistQuery (post) -> same as above

/randomAlbum (get)

/randomArtist (get)

/randomSong (get)

/albumAggQuery (post)  ->  Returns a list of aggregations {tag, count, songCount, sizeInMb} for a specific column.  The object posted is a JSON object with a 'column' attribute specifying the column on which to aggregate.  For example {column: 'releaseYear'}

/artistAggQuery (post) -> same idea as albumAggQuery, but you get an additional statistic:  albumCount, and the count statistic refers to # artists of course.

/songSearch/:searchPattern (get) -> you supply a fragment of a song name and get a list of songs in return.

/albumSearch/:searchPattern (get) -> you supply a fragment of a album name and get a list of albums in return.

/artistSearch/:searchPattern (get) -> you supply a fragment of a artist name and get a list of artists in return.

'/song/:id' (get) ->  Stream the song with the specified id.  Note this is not available (501) on AWS do to logistical (i.e., I dont want to load my entire collection in the cloud) and legal (i.e., streaming copyrighted mp3s on a web service is of of questionable legality) purposes.

## Structures
These are the data structures which are used by this API.  These are of course JSON, but I am providing a type below to help w/the understanding of data rendering and manipulation.  

### Artists:
    int _id   
    string artist   //
    string nationality
    int dateOfInterest
    int albumCount
    int songCount
    float sizeInMb
    object[] album
        int albumpk
        string title
        int releaseYear
        int aquisitionYear
        bool downloaded
        int songcount
        object[] songs  
            int songPk
            string songName

### Albums
    int _id   
    string title
    int releaseYear
    int aquisitionYear
    string downloaded ("true" or "false")
    int songcount
    object[] songs  
        int songPk
        string songName
    int artistfk
    string artist
    string nationality
    int dateOfInterest
    float sizeInMb

### Song
    string songName
    string title   (i.e., album title)
    string artist
    int albKey
    int songPk



