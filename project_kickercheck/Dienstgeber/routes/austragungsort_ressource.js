var app = express.Router();

app.get('/',function(req,res){

    //Speichert die alle Benutzer
    var response=[];    

    //returned ein Array aller Keys die das Pattern Benutzer* matchen 
    client.keys('Austragungsort *', function (err, key) {
	   
	     client.mget(key, function (err, austragungsort) {
		     
        //Frage alle diese Keys aus der Datenbank ab und pushe Sie in die Response
       austragungsort.forEach(function (val) {
	     
       response.push(JSON.parse(val));
            });
            
    
    res.status(200).set("Content-Type","application/json").json(response).end();
    
    });
       });
        });
        
        
app.get('/:AustragungsortId', function(req, res) {

    //Angefragte Id extrahieren 
    var austragungsortId = req.params.AustragungsortId;

    //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
    client.exists('Austragungsort ' + austragungsortId, function(err, IdExists) {

        //Die Lokalitaet existiert im System und ist nicht für den Zugriff von außen gesperrt
        if (!IdExists) {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }

        //Angefragte Ressource existiert 
        else{

            var acceptedTypes = req.get('Accept');

            switch (acceptedTypes) {

                    //Client erwartet content type application/json
                case "application/json":

                    client.mget('Austragungsort ' + austragungsortId, function(err,austragungsortdata){
	                    
                        
	                    var Austragungsortdaten = JSON.parse(austragungsortdata);
						
                         
                            //Setze Contenttype der Antwort auf application/json
                            res.set("Content-Type", 'application/json').status(200).json(Austragungsortdaten).end();
                            
                    });
                    
                    break;

                default:
                    //Der gesendete Accept header enthaelt kein unterstuetztes Format 
                    res.status(406).send("Content Type wird nicht unterstuetzt");
                    //Antwort beenden        
                    res.end();
                    break;
            }
        }
    });
});

app.post('/',function(req, res) {
	

    //Abruf eines Tisches, nur dann wenn client html verarbeiten kann 
    var contentType = req.get('Content-Type');

    //Check ob der Content Type der Anfrage xml ist 
    if (contentType != "application/json") {
        res.set("Accepts", "application/json");
        res.status(406).send("Content Type is not supported");
        res.end();
    }

    else{

	var Austragungsort = req.body;
	
        // LokalitaetId in redis erhöhen, atomare Aktion 
        client.incr('AustragungsortId', function(err, id) {
	        
	          var austragungsortObj={
                'id' : id,
                 'Name': Austragungsort.Name,
                'Adresse': Austragungsort.Adresse,
                'Beschreibung': Austragungsort.Beschreibung
            };
            
             client.set('Austragungsort ' + id, JSON.stringify(austragungsortObj));
             
              //Setze Contenttype der Antwort auf application/atom+xml
            res.set("Content-Type", 'application/json').set("Location", "/Austragungsort/" + id).status(201).json(austragungsortObj).end();

        });
    }
});


app.put('/:AustragungsortId', function(req, res) {

    var contentType = req.get('Content-Type');

    //Wenn kein JSON geliefert wird antwortet der Server mit 406- Not acceptable und zeigt über accepts-Header gütlige ContentTypes 
    if (contentType != "application/json") {
        //Teile dem Client einen unterstuetzten Type mit 
        res.set("Accepts", "application/json");
        //Zeige über den Statuscode und eine Nachricht 
        res.status(406).send("Content Type is not supported"); 
        //Antwort beenden
        res.end();   
    } 

    else {    
        //Extrahiere Id aus der Anfrage 
        var austragungsortId = req.params.AustragungsortId;

        //Exists returns 0 wenn der angegebe Key nicht existiert, 1 wenn er existiert  
        client.exists('Austragungsort' + AustragungsortId, function(err, IdExists) {

            //client.exists hat false geliefert 
            if (!IdExists) {
                res.status(404).send("Die Ressource wurde nicht gefunden.");
                res.end();
            }

            //Ressource existiert     
            else {
	            
	            //Lese aktuellen Zustand des Turniers aus DB
                client.mget('Austragungsort '+austragungsortId,function(err,austragungsortdata){

				var Austragungsortdaten = JSON.parse(austragungsortdata);
				
                    //Aktualisiere änderbare Daten 
                    Austragungsort.Name = req.body.Name;
                    Austragungsort.Adresse = req.body.Adresse;
                    Austragungsort.Beschreibung = req.body.Beschreibung;


                    //Schreibe Turnierdaten zurück 
                    client.set('Austragungsort ' + austragungsortId,JSON.stringify(Austragungsortdaten));
           

            //Antorte mit Erfolg-Statuscode und schicke geänderte Repräsentation 
            res.set("Content-Type", 'application/json').status(201).json(Austragungsortdaten).end();

             
            });
            }
        });
    }
});

app.delete('/:AustragungsortId', function(req, res) {

    //Extrahiere Id aus der Anfrage 
    var AustragungsortId = req.params.AustragungsortId;

    //Prüfe ob Lokalitaet existiert 
    client.exists('Austragungsort ' + AustragungsortId, function(err, IdExists) {

        //Lokalitaet existiert 
        if(IdExists) {

            //Entferne EIntrag aus der Datenbank 
            client.del('Austragungsort ' + AustragungsortId);

            //Alles ok , sende 200 
            res.status(204).send("Das hat funktioniert! Austragungsort gelöscht");

            //Antwort beenden
            res.end();
        }

        else {
            res.status(404).send("Die Ressource wurde nicht gefunden.");
            res.end();
        }
    });
});

module.exports = app;
