var express = require('express');
var request = require("request");
var bodyParser = require('body-parser')
const util = require('util');
require('dotenv').config()

var app = express();
var port = process.env.port | 80;

//use ejs template
app.set('view engine','ejs');

//Allow Self Signed Certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

//Enable Cookie during authorize
var request = request.defaults({jar: true});

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
//UniFi server credentials
var controller = {
    baseUrl : process.env.PORTAL_URL,
    unifiUser : process.env.USERNAME,// your UniFi Username
    unifiPass : process.env.PASSWORD // your UniFi Password
};

//load the index page
app.get('/guest/s/default/', function(req, res) {
    res.render('index',{id : req.query.id});
});

//Request send data to the Unifi controller 
//to authorize the sever
var server_data = JSON.stringify({username : controller.unifiUser,password : controller.unifiPass});
request.post({
    url : controller.baseUrl+"/api/login",
    form : server_data}, 
    function (error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); 
    });

//Response to the post method and authorize guest
app.post('/auth-server',function(req,res){
    var mac = req.body.mac;
    var email = util.format('{  \"email\": \"%s\"}', req.body.email);
    var data_guest = 'json=' + JSON.stringify({
        	cmd : 'authorize-guest',
        	mac : mac,
            minutes : 120
    }); 
    // subscribe and check newsletter
    request({
        method: 'POST',
        url: 'http://api.evestemptation.com/api/v1/customers/newsletter',
        headers: {'Content-Type': 'application/json'},
        body: email}, function (error, response, body) {
            console.log('Status:', response.statusCode);
            console.log('Headers:', JSON.stringify(response.headers));
            console.log('Response:', body);
            var body = JSON.parse(body);            
            if(body.code == "EEDE" || body.code == "0000" ){
                request.post({
                    url : controller.baseUrl + "/api/s/default/cmd/stamgr",
                    form : data_guest},function (error, response, body) {
                        console.log('error:', error); // Print the error if one occurred 
                        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
                        console.log('body:', body);
                });
                res.redirect(process.env.REDIRECTING_ADDRES);//the subscirption success -> authorzie success
            }
            else{
                res.redirect("/guest/s/default/");//the subscirption fail -> authorzie fail
            }
    });
});


app.listen(port,process.env.SEVER_ADDRESS);
