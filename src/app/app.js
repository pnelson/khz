App = Ember.Application.create();

App.Router.map(function() {
  this.resource('loop', { path: ':loop_id' });
});

App.IndexRoute = Ember.Route.extend({
  beforeModel: function() {
    this.replaceWith('loop', '0ZIiIiIgAAAAAAAAAAAAAAAAAgACAgACAAA==');
  }
});

App.LoopRoute = Ember.Route.extend({

  model: function(params) {
    var beats = [];
    var version = params.loop_id[0];
    var decoded = window.atob(params.loop_id.slice(1));
    // break the data into chunks of 4
    for (var i = 1; i < decoded.length; i += 4) {
      var bar = [];
      // unpack the chunk into additional chunks of 4
      for (var j = 0; j < 4; j++) {
        var chunk = decoded.charCodeAt(i + j);
        var notes = this.unpack(chunk);
        bar = bar.concat(notes);
      }
      // append the unpacked bar to the beats array
      beats.push(bar.map(function(note) {
        return App.Note.create({
          buffer: (i - 1) / 4,
          intensity: parseInt(note, 10)
        });
      }));
    }
    // return the completed data model
    return {
      version: version,
      tempo: parseInt(decoded.charCodeAt(0), 10),
      beats: beats
    };
  },

  serialize: function(model) {
    // get an array of ternary digits representing the beat
    var notes = [].concat.apply([], model.beats).map(function(note) {
      return note.get('intensity');
    });
    // break the array into chunks of 4
    var groups = [];
    for (var i = 0; i < notes.length; i += 4) {
      var chunk = notes.slice(i, i + 4);
      groups.push(chunk);
    }
    // pack 4 ternary digits into one byte
    var chars = groups.map(function(group) {
      return (group[0] << 6) +
             (group[1] << 4) +
             (group[2] << 2) +
             parseInt(group[3], 3);
    });
    // prepend the tempo
    chars.unshift(model.tempo);
    // build a string from the character codes
    chars = String.fromCharCode.apply(null, chars);
    // base64ify the string
    return { loop_id: model.version + window.btoa(chars) };
  },

  unpack: function(data) {
    return [data >> 6, (data >> 4) & 0x3, (data >> 2) & 0x3, data & 0x3];
  }

});

App.LoopController = Ember.ObjectController.extend({

  context: null,
  buffers: [],
  volumes: [0, 0.4, 1],

  isReady: false,
  isPlaying: false,

  timeoutId: null,

  init: function() {
    this._super();
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    if (!this.context.createGain)
      this.context.createGain = this.context.createGainNode;
    this.loadKit('00');
  },

  actions: {

    clear: function(notes) {
      for (var i = 0; i < notes.length; i++)
        notes[i].set('intensity', 0);
      this.updateLoopId();
    },

    toggle: function() {
      this.toggleProperty('isPlaying') ? this.play() : this.stop();
    },

    tempoDown: function() {
      var tempo = this.get('tempo');
      this.set('tempo', Math.max(20, tempo - 5));
      this.updateLoopId();
    },

    tempoUp: function() {
      var tempo = this.get('tempo');
      this.set('tempo', Math.min(200, tempo + 5));
      this.updateLoopId();
    },

    preset: function(presetId) {
      switch (presetId) {
      case 1:
        this.get('target').replaceWith('loop', '0ZIiIiIgAAAAAAAAAAAAAAAAAgACAgACAAA==');
        break;
      case 2:
        this.get('target').replaceWith('loop', '0ZIiYiYiCCCCQAAAABAAAAAIAAAAAgICAgA==');
        break;
      default:
        this.get('target').replaceWith('loop', '0ZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==');
      }
    },

  },

  loadKit: function(kitId) {

    var urls = [
      'static/sounds/' + kitId + '/hihat.wav',
      'static/sounds/' + kitId + '/tom1.wav',
      'static/sounds/' + kitId + '/tom2.wav',
      'static/sounds/' + kitId + '/tom3.wav',
      'static/sounds/' + kitId + '/snare.wav',
      'static/sounds/' + kitId + '/kick.wav'
    ];

    for (var i = 0; i < urls.length; i++)
      this.loadBuffer(urls[i], i, urls.length);

  },

  loadBuffer: function(url, index, total) {

    var that = this;
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    request.onload = function() {
      that.context.decodeAudioData(
        request.response,
        function(buffer) {
          that.buffers[index] = buffer;
          if (that.buffers.length == total)
            that.isReady = true;
        },
        function(error) {
          console.error("Error decoding audio data: ", error);
        }
      );
    }

    request.send();

  },

  playSound: function(buffer, intensity, time) {
    var source = this.context.createBufferSource();
    var volume = this.context.createGain();
    source.buffer = this.buffers[buffer];
    source.connect(volume);
    volume.connect(this.context.destination);
    volume.gain.value = this.volumes[intensity];
    if (!source.start)
      source.start = source.noteOn;
    time = typeof time !== 'undefined' ? time : this.context.currentTime;
    source.start(time);
  },

  loop: function(that) {
    var start = that.context.currentTime;
    var sixteenth = (60 / that.get('tempo')) / 4;
    // queue the next loop
    that.timeoutId = window.setTimeout(that.loop, (sixteenth * 16) * 1000, that);
    // queue the sounds for the current loop
    for (var beat = 0; beat < 16; beat++) {
      var time = start + (beat * sixteenth);
      for (var i = 0; i < that.buffers.length; i++)
        that.playSound(i, that.get('beats')[i][beat].intensity, time);
    }
  },

  play: function() {
    this.timeoutId = window.setTimeout(this.loop, 0, this);
  },

  stop: function() {
    window.clearTimeout(this.timeoutId);
  },

  updateLoopId: function() {
    this.replaceRoute('loop', this.get('model'));
  }

});

App.NoteController = Ember.ObjectController.extend({

  needs: ['loop'],
  loop: Ember.computed.alias('controllers.loop'),

  actions: {
    click: function() {
      var current = this.get('intensity');
      this.set('intensity', (current + 1) % 3);
      this.get('loop').updateLoopId();
      this.get('loop').playSound(this.get('buffer'), this.get('intensity'));
    }
  }

});

App.Note = Ember.Object.extend({

  buffer: null,
  intensity: 0,

  icon: function() {
    if (this.get('intensity') === 0)
      return 'fa fa-circle-o fa-2x';
    if (this.get('intensity') === 1)
      return 'fa fa-dot-circle-o fa-2x';
    return 'fa fa-circle fa-2x';
  }.property('intensity')

});
