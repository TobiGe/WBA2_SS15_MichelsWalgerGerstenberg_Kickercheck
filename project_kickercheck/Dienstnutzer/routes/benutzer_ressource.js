var app = express.Router();

app.get('/addBenutzer', function(req, res) {
    res.render('pages/addBenutzer');
});

app.get('/alleBenutzer', function(req, res) {

    var options = {
        host: "localhost",
        port: 3000,
        path: "/Benutzer",
        method:"GET",
        headers:{
            accept:"application/json"
        }
    }
    var externalRequest = http.request(options, function(externalResponse){

        externalResponse.on("data", function(chunk){

            var benutzerAll = JSON.parse(chunk);
            res.render('pages/allebenutzer',{benutzerAll:benutzerAll});
            res.end();
        });
    });
    externalRequest.end();
});

app.get('/:BenutzerId', function(req, res) {

    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer/'+req.params.BenutzerId,
        method: 'GET',
        headers: {
            accept: 'application/json'
        }
    };

    var x = http.request(options, function(externalres){
        externalres.on('data', function(chunk){

            var benutzer = JSON.parse(chunk);

            res.render('pages/einbenutzer', { benutzer: benutzer });
        });
    });                     
    x.end();
});

app.post('/', function(req, res) {

    // Speichert req.body
    var BenutzerAnfrage = req.body;


    // HTTP Header setzen
    var headers = {
         'Accept' : 'application/json',
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer',
        method: 'POST',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {

        //console.log(JSON.stringify(externalResponse.headers.location));

        if(externalResponse.statusCode == 400){
            res.status(400).end();
        };

        externalResponse.on('data', function (chunk) {

            var benutzer = JSON.parse(chunk);
            res.json(benutzer);
            res.end();
        });

    });

    externalRequest.write(JSON.stringify(BenutzerAnfrage));
    externalRequest.end();
});

app.put('/:BenutzerId', function(req, res) {

    var BenutzerDaten = req.body;
    var benutzerId = req.params.BenutzerId;


   // console.log(util.inspect(BenutzerDaten, false, null));

    // HTTP Header setzen
    var headers = {
         'Accept' : 'application/json',
        'Content-Type': 'application/json'
    };

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer/'+benutzerId,
        method: 'PUT',
        headers: headers
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            var changeBenutzer = JSON.parse(chunk);

         //   console.log(util.inspect(changeBenutzer, false, null));

            res.json(changeBenutzer);
            res.end();


        });

    });

    externalRequest.write(JSON.stringify(BenutzerDaten));

    externalRequest.end();

});

app.delete('/:BenutzerId', function(req, res) {

    var benutzerId = req.params.BenutzerId;

    // Mit Server verbinden
    var options = {
        host: 'localhost',
        port: 3000,
        path: '/Benutzer/'+benutzerId,
        method: 'DELETE'
    };

    var externalRequest = http.request(options, function(externalResponse) {


        externalResponse.on('data', function (chunk) {

            res.end();


        });

    });

    externalRequest.end();
});

module.exports = app;


app.delete('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
    var benutzerId = req.params.BenutzerId;
    //Extrahiere Id aus der Anfrage 
    var HerausforderungId = req.params.HerausforderungId;

    //Prüfe ob Lokalitaet existiert 
    client.exists(benutzerId+'Herausforderung ' + HerausforderungId, function(err, IdExists) {

        //Lokalitaet existiert 
        if(IdExists) {
            console.log("ES IST DA");
            //Entferne EIntrag aus der Datenbank 
            client.del(benutzerId+'Herausforderung ' + HerausforderungId);

            //Alles ok , sende 200 
            res.status(204).send("Das hat funktioniert! Herausforderung gelöscht");

            //Antwort beenden
            res.end();
        }

        else {
            console.log("GAR NICHT MEHR");
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }
    });
    
});

app.get('/:BenutzerId/alleHerausforderungen', function(req, res) {
    
    var benutzerId = req.params.BenutzerId;
    //Speichert alle Herausforderungen
    var response=[];    

    //returned ein Array aller Keys die das Pattern Herausforderung* matchen 
    client.keys(benutzerId+'Herausforderung *', function (err, key) {

        if(key.length == 0) {
            res.json(response);
            return;
        }

        client.mget(key, function (err, Herausforderung) {

            //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
            Herausforderung.forEach(function (val) {
                response.push(JSON.parse(val));
            });
            
            
            //res.set("Content-Type","application/json");
            res.render('pages/alleHerausforderungen',{response:response});
            res.end();

        });

    });
    
})


app.get('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
    var herausforderungId = req.params.HerausforderungId;
    var benutzerId = req.params.BenutzerId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists(benutzerId+ 'Herausforderung ' + herausforderungId, function(err, IdExists) {

        //Lokalitaet kennt einen Tisch mit dieser TischId
        if (IdExists) {

            //Ermittle vom Client unterstützte content types 
            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                    //Client kann application/json verarbeiten 
                case "application/json":
                    
                   
                        client.mget(benutzerId+ 'Herausforderung ' + herausforderungId, function(err,HerausforderungDaten){

                        var HerausforderungDaten= JSON.parse(HerausforderungDaten);
                            
                        //Setze Contenttype der Antwort auf application/json
                        res.set("Content-Type", 'application/json').status(200).json(HerausforderungDaten).end();
                    });       
                    break;

                default:

                    //We cannot send a representation that is accepted by the client 
                    res.status(406);
                    res.set("Accepts", "application/json");
                    res.end();

                    break;
            }
        }       
        //Unbekannt
        else {
            res.status(404).send("Die Ressource wurde nicht gefunden herausfor.");
            res.end();
        }
    });
    
});

app.put('/:BenutzerId/Herausforderung/:HerausforderungId', function(req, res) {
    
});

app.post('/:BenutzerId/Herausforderung', function(req, res) {

    var Herausforderung = req.body;
    var benutzerId = req.params.BenutzerId;
    

    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage json ist
    
    if (contentType != "application/json") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    }

    else {

        //Inkrementiere  in der DB , atomare Aktion 
        client.incr('HerausforderungId', function(err, id) {

            var HerausfoderungObj={
                'id' : id,
                'Herausforderer': Herausforderung.Herausforderer,
                'Datum': Herausforderung.Datum,
                'Kurztext' : Herausforderung.Kurztext
            };
            console.log(benutzerId +'Herausforderung ' + id); 
            client.set(benutzerId +'Herausforderung ' + id, JSON.stringify(HerausfoderungObj));
            //Pflege Daten über den Kickertisch in die DB ein 

            //Teile dem Client die URI der neu angelegten Ressource mit 
            res.set("Location", "/Herausforderung/" + id);

            //Setze content type der Antwort 
            res.set("Content-Type","application/json");

            //Zeige dem Client mit Statuscode 201 Erfolg beim anlegen an  
            res.json(req.body);

            //Antwort beenden 
            res.end();
        });
    }    
});

module.exports = app;