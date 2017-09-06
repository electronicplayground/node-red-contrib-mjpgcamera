var MjpegCamera = require('mjpeg-camera');
var util = require('util');
var Stream = require('stream');

/**
 *  @param {Object} options
 *    @param {Function=} options.transform
 *    @param {String=} options.ext
 *    @param {Boolean=} options.onData
 *    @param {Object=} options.context
 */

function StreamPipe(options) {
  options = options || {};

  this.transform = options.transform || function(data) { return data; };

  this.writable = true;
  this.context = options.context;
  this.filter = options.filter || function() { return true; };

  this.onData = options.onData;
}
util.inherits(StreamPipe, Stream);

StreamPipe.prototype.write = function(data) {

  // If the data doesn't pass the filter, return
  if (!this.filter(data)) return;
  // Transform the data before write
  var transformedData = this.transform.call(this.context, data);
  // Write data
  if (this.onData != null && this.onData != undefined)
  {
    this.onData.call(this.context,transformedData);
  }
};


StreamPipe.prototype.end = function(data) {
  this.write(data);
  this.writable = false;
};

StreamPipe.prototype.destroy = function() {
  this.writable = false;
};



module.exports = function(RED) {
    function MjpgConsumer(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        var streamPipe;
        var camera;
        var sendData = true;
        var isCameraOn = false;
        var buffer;

        this.on('input', function(msg) {
           if (streamPipe == null){
              console.log("create streampipe");
              streamPipe = new StreamPipe({
                    transform: function(frame) {
                      //console.log(frame);
                      return frame.data;
                    },
                    onData: saveFrame
                  });
            }

            if (camera == null){
              // Create an MjpegCamera instance
              camera = new MjpegCamera({
                url: config.stream,
                motion: false
              });

            }

            handleMessage(msg);
        });

        function handleMessage(msg) {
          console.log("message: "+JSON.stringify(msg));

          if (msg.payload == "start"){
            startCamera();
            camera.pipe(streamPipe);
            sendData = true;
          }

          if (msg.payload == "stop"){
            stopCamera();
            sendData = false;
          }
        }

        let timer;
        function setupStreamInterval() {
            console.log("interval "+config.interval * 1000);
            clearInterval(timer);
            if (config.interval)
              timer = setInterval(sendBuffer, config.interval * 1000);
        }

        function sendBuffer() {
          if (sendData == true){
            var msg = {};
            msg.payload = buffer;
            node.send(msg);
            console.log("send data on timer");
          }
        }

        var saveFrame = function(data){
          buffer = data;
        }

        var startCamera = function(){
            if (isCameraOn == true)
                return;

            setupStreamInterval();
            isCameraOn = true;
            camera.start();
        }

        var stopCamera = function(){
          camera.stop();
          clearInterval(timer);
          isCameraOn = false;
        }

        this.on('close', function(){
          console.log("closing");
          clearInterval(timer);
          if (camera != null) {
              camera.stop();
          }

        })

    }
    RED.nodes.registerType("mjpg-consumer",MjpgConsumer);
}
