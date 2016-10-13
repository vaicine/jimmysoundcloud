var context;
var bufferLoader;

// default options
var stopOnChange = true;
var allowOverlap = false;

window.onload = init;

// Is used for loading in all the buffers which are then played!
var bList;

// Holds all active buffers. Is used so that we can stop them at all times
var activeBuffers = [];


// mp3 files and sources
var soundfiles = [
  "alright.mp3",
"alrightthen.mp3",
"api.mp3",
"arewedone.mp3",
"arewefinished.mp3",
"badtimes.mp3",
"barewithme.mp3",
"buyapowa.mp3",
"cats.mp3",
"ding.mp3",
"dontcare.mp3",
"dontcare2.mp3",
"fullofcats.mp3",
"goodtimes.mp3",
"hay.mp3",
"hayjimmy.mp3",
"hello.mp3",
"hiimjimmy.mp3",
"hiimjimmy3.mp3",
"hiimjimmy4.mp3",
"imjimmy.mp3",
"internet.mp3",
"letsgoshopping.mp3",
"nice.mp3",
"niceandsimple.mp3",
"nicefomo.mp3",
"notallislost.mp3",
"pow.mp3",
"texus.mp3",
"thatsenough.mp3",
"thatsgreat.mp3",
"theresnooneinthere.mp3",
"unowot.mp3",
"whatshappenedhere.mp3",
"whocares.mp3",
"yeah.mp3"
];

var sourcefiles = [];







// buffer loader class

function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function(url, index) {
  // Load buffer asynchronously
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var loader = this;

  request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
      request.response,
      function(buffer) {
        if (!buffer) {
          alert('error decoding file data: ' + url);
          return;
        }
        loader.bufferList[index] = buffer;
        if (++loader.loadCount == loader.urlList.length)
          loader.onload(loader.bufferList);
      },
      function(error) {
        console.error('decodeAudioData error', error);
      }
    );
  };

  request.onerror = function(e) {
    alert('BufferLoader: XHR error');
    console.log(e);
  };

  request.send();
};

BufferLoader.prototype.load = function() {
  for (var i = 0; i < this.urlList.length; ++i)
      this.loadBuffer(this.urlList[i], i);
};

// END bufferloader class

// BEGIN custom code


function generatePanelLinks(idName, linkfiles, modifyLinktext) {

  var links = $("#" + idName).append('<ul class="list-group">');

    $.each(soundfiles, function (i) {
        links.append("<li class=\"list-group-item\"><a href=\"" +
                       linkfiles[i] + "\" target=\"_blank\">" +
                       modifyLinktext(soundfiles[i]) + "</a></li>");
    });

}


function generateSourceLinks() {
  generatePanelLinks("sourcelinks", sourcefiles, function (s) { return s.slice(0, -4); });
}


function generateDownloadLinks() {
  // NOTICE: Maybe I have to change the linkfiles to an absolute path.
  generatePanelLinks("downloadlinks", soundfiles, function (s) { return s; });
}


function loadFilesInMemory() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    context = new AudioContext();

    bufferLoader = new BufferLoader(
        context,
        soundfiles,
        finishedLoading
    );

    bufferLoader.load();
}


function init() {
  generateSourceLinks();
  generateDownloadLinks();
  loadFilesInMemory();
}


function generateListOfHotKeys() {
    var hotkeys = [];
  for(var i = 48; i <= 57; i++) {
        hotkeys.push(i);
  }
    for(var i = 97; i <= 122; i++) {
        hotkeys.push(i);
  }
  return hotkeys;
}



function createHotkeys() {
  var hotkeys = generateListOfHotKeys();

    $.each(soundfiles, function (i) {
        var btn = document.getElementById(i);
        var badge = document.createElement("span");
        badge.classList.add("badge", "hotkey-badge");
        badge.style.marginLeft = "1.2em";
        badge.innerHTML = String.fromCharCode(hotkeys[i]);
        btn.appendChild(badge);
    });
}

function createButtonWrapper (){
  var wrapper = document.createElement("div");
  $(wrapper).addClass('col-xs-12 col-sm-6 col-md-4');
  return wrapper;
}

function cycleButtonColors(i){
  var options = ['primary','success','info','warning','danger'];
  var random = options[Math.floor(Math.random() * options.length)];
  var selected = options[i%options.length];
  return selected;
}

function displayPlayButtons () {
    $.each(soundfiles, function (i) {
        var btn = document.createElement("button");
        var buttonColor = 'btn-' + cycleButtonColors(i);
        btn.type = "button";
        btn.innerHTML = "<strong>" + soundfiles[i].slice(0,-4) + "</strong>";
        btn.id = i;
        btn.onclick = function() { playComposition(bList[this.id]); };
        btn.classList.add("btn", buttonColor, "btn-block", "spaced-button");

        var wrapper = createButtonWrapper();
        wrapper.appendChild(btn);
        document.getElementById("buttons").appendChild(wrapper);
    });
}


function setUpToggleHotkeys() {
    $("#togglehotkeys").bind("click", function () {
        $("span.badge").toggleClass("hidden");
        $(this).text( $(this).text() == "Show Hotkeys" ? "Hide Hotkeys" : "Show Hotkeys");
    });
}


function addKeyboardControls() {
    $(document).keypress(function (e) {
        // for 0 to 9
        if (e.which >= 48 && e.which <= 57) {
            $("#" + (e.which - 48)).click();
        }
        // for a to z
        else if (e.which >= 97 && e.which <= 122)
        {
            $("#" + (e.which - 87)).click();
        }
    });
}


function loadUIElements() {
    $("#loading").hide();

  displayPlayButtons();
    createHotkeys();
  setUpToggleHotkeys();
  addKeyboardControls();
}



function finishedLoading(bufferList) {
  // HACK: Makes the parameter global so that we get access to it.
  // It is implicitly loaded
    bList = bufferList;

  loadUIElements();
}

function IsNumeric(input)
{
    return (input - 0) == input && (''+input).trim().length > 0;
}


function play(buffer, drive, gain) {
  var source = context.createBufferSource();
  source.buffer = buffer;

  // check if we are allowing sounds to overlap
  if (!allowOverlap){
    stopPlaying();
  }

  activeBuffers.push(source);

  var gainNode = context.createGain();

  var adjustedGain = IsNumeric(gain) && gain > 0 ? gain / 10 : 0;

  gainNode.gain.value = adjustedGain;
  activeBuffers.push(gainNode);

  source.connect(gainNode);

  if (drive === 0)
  {
    gainNode.connect(context.destination);

  } else {
    // workaround for using overdrive which is a bit low in volume
    var overdrive = new Overdrive(context);
    overdrive.drive = drive;
    overdrive.color = 8000;
    gainNode.connect(overdrive.input);

    var gain2 = context.createGain();
    overdrive.connect(gain2);
    activeBuffers.push(gain2);

    // apply second gain of 2.6
    gain2.gain.value = 2.6;
    gain2.connect(context.destination);
  }

  source.start(0);
}



function playComposition(buf) {
  var drive = document.getElementById("drive").value / 10.0;
  var gain = document.getElementById("gain").value;
  play(buf, drive, gain);
}

function stopPlaying (){
  for (var i = 0; i < activeBuffers.length; i++) {
      activeBuffers[i].disconnect(0);
  }
  activeBuffers = [];
}

// hitting escape or enter will stop all sounds
document.onkeyup = function(e) {
  if (e.keyCode == 13 || e.keyCode == 27) {
    stopPlaying();
  }
};
