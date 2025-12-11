import express from 'express';
import { Xtream } from '@iptv/xtream-api';

const app = express();
const port = process.env.PORT || 3001;

		

app.get("/", (req, res) => res.type('html').send(html_default_response));

//m3u
app.get("/get.php", function(req, res){
		
	res.type('html').sendStatus(404);

});

app.get("/player_api.php", function(req, res){
	
	console.log(req.query.server);
	var m_var_Server = req.query.server;
	var m_var_Username = req.query.username;
	var m_var_Password = req.query.password;
	
	res.type('json').send("[{'a': 1}, {'a': 2}]");
	
});


//EPG
app.get("/xmltv.php", function(req, res){
		
	res.type('html').sendStatus(404);

});


app.get('/{*splat}', function(req, res) {

	console.log(req.url);
	res.type('html').sendStatus(404);

});

const server = app.listen(port, () => console.log(`Example app listening on port ${port}!`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;

const html_default_response = `
<!DOCTYPE html>
<html>
  <body>
    <section>
      Hello there!
    </section>
  </body>
</html>
`;


