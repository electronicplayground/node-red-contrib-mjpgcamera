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
        var sendData = false;
        var isCameraOn = false;

        this.on('input', function(msg) {
           if (streamPipe == null){
              console.log("create streampipe");
              streamPipe = new StreamPipe({
                    transform: function(frame) {
                      //console.log(frame);
                      return frame.data;
                    },
                    onData: pipeFrame
                  });
            }

            if (camera == null){
              // Create an MjpegCamera instance
              camera = new MjpegCamera({
                url: config.stream,
                motion: false
              });

            }

            if (msg.payload == "start"){
              startCamera();
              camera.pipe(streamPipe);
              sendData = true;
            }

            if (msg.payload == "stop"){
              stopCamera();
              sendData = false;
            }

           if (msg.payload == true){
              sendData = true;
            }
            else {
              sendData = false;
            }
        });

        var pipeFrame = function(data){
          if (sendData == true){
            var msg = {};
            msg.payload = data;
            node.send(msg);
            sendData = false;
          }
        }

        var startCamera = function(){

            if (isCameraOn == true)
                return;

            isCameraOn = true;
            camera.start();
        }

        var stopCamera = function(){
          camera.stop();
          isCameraOn = false;
        }

        this.on('close', function(){
          console.log("closing");
          if (camera != null) {
              camera.stop();
          }

        })

    }
    RED.nodes.registerType("mjpg-consumer",MjpgConsumer);
}
