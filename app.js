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
	
	console.log(req.url);
	var m_var_Server = req.query.server;
	var m_var_Username = req.query.username;
	var m_var_Password = req.query.password;
	var m_var_Action = req.query.action; //get_profile get_server_info get_live_streams get_channel_categories
	
	
	if(m_var_Action == "get_profile" || m_var_Action == "get_server_info"){
		var returnVal = {"user_info":{"username":"020a99bbf5","password":"aaa38a3ab0","message":"Welcome to World 8K","auth":1,"status":"Active","exp_date":"1768031057","is_trial":"0","active_cons":"1","created_at":"1765352657","max_connections":"1","allowed_output_formats":["m3u8","ts","rtmp"]},"server_info":{"url":"cf.business-cdn.me","port":"80","https_port":"443","server_protocol":"http","rtmp_port":"25462","timezone":"Europe\/Amsterdam","timestamp_now":1765445611,"time_now":"2025-12-11 10:33:31","process":true}}
		res.type('json').send(returnVal);
	}else{
		res.type('json').send("[{'a': 1}, {'a': 2}]");

	}
	
	
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


