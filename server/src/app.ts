import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import todoRoutes from './routes'
import WebSocket  from "ws";
const app=express()
var Schema = mongoose.Schema
const PORT: string | number = process.env.PORT || 4000
var bodyParser = require('body-parser')

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.use( bodyParser.json() );
app.use(cors())
app.use(todoRoutes)

const wss = new WebSocket.Server({
    port: 8000,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed.
    }
});
wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        wss.clients.forEach(function each(client) {
            if(message.toString()==='refresh'){
                if(client!==ws && client.readyState === WebSocket.OPEN){
                    client.send(message.toString());}
                }
            else if (client.readyState === WebSocket.OPEN) {
                client.send(message.toString());}
        });
    });
});

const numberSchema = new Schema({
    integerOnly: {
        type: Number,
        default: 100,
    }
});
const MeetingLen: any = mongoose.model('MeetingLen', numberSchema);
const doc = new MeetingLen();
// let meetingLen = doc.integerOnly.get();
app.get('/meeting-len',function(req, res) {
    // let num = doc.get();
    try{
    let meetingLen = doc.integerOnly;
    res.status(200).json({meetingLen})
    } catch (error) {
        throw error
    }
    // return num;
});
app.post('/post-meeting-len', urlencodedParser, function(req, res) {
    try{
        let meetingLen = req.body.meetingLen;
        doc.integerOnly = meetingLen;
        // doc.update({integerOnly:req.body.data})
        // let something = 90;
        res.status(200).json(meetingLen)
    } catch (error) {
        throw error
    }
});

const uri: string = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.07m5b.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
const options = { useNewUrlParser: true, useUnifiedTopology: true }
mongoose.set('useFindAndModify', false)

mongoose
    .connect(uri, options)
    .then(() =>
        app.listen(process.env.PORT || 4000, () =>
            console.log(`Server running on http://localhost:${PORT}`)
        )
    )
    .catch((error) => {
        throw error
    })
