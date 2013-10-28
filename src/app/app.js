App = Ember.Application.create({
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true
});

App.Router.reopen({
  location: 'history'
});

App.Router.map(function() {
  this.resource('loop', { path: ':loop_id' });
});

App.IndexRoute = Ember.Route.extend({
  beforeModel: function() {
    // TODO: was transitionTo but i think that is why some websites suck with back button
    this.replaceWith('loop', '00AGQAAAAgACAAIAAgABABAQAQABAQAQEBEAERECIBIgEiASIBACAAIAAgACAAEAEBABAAEBABAQEQAREQIgEiASIBIgE=');
  }
});

App.LoopRoute = Ember.Route.extend({

  model: function(params) {
    var beats = [];
    var version = parseInt(params.loop_id.slice(0, 2), 10);
    var encoded = params.loop_id.slice(2);
    var decoded = base64ToHex(encoded);
    for (var i = 8; beats.length < 8; i += 16) {
      var notes = decoded.slice(i, i + 16).split('');
      beats.push(notes.map(function(note) {
        return App.Note.create({ intensity: parseInt(note, 10) })
      }));
    }
    return {
      version: version,
      kit: parseInt(decoded.slice(0, 2), 16),
      tempo: parseInt(decoded.slice(2, 4), 16),
      // 4-6
      // 6-8
      beats: beats
    };
  },

  serialize: function(model) {
    console.log('serialize');
    var parts = [ this.toPaddedHex(model.kit), this.toPaddedHex(model.tempo), '0000' ];
    var notes = model.beats.map(function(notes) {
      return notes.map(function(note) {
        return note.get('intensity');
      }).join('');
    });
    parts = parts.concat(notes).join('');
    return { loop_id: this.toPaddedHex(model.version) + hexToBase64(parts) };
  },

  toPaddedHex: function(n) {
    var hex = n.toString(16);
    if (hex.length === 1)
      return '0' + hex;
    return hex;
  }

});

App.LoopController = Ember.ObjectController.extend({

  context: null,
  isPlaying: false,

  init: function() {
    this._super();
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    //var loader = new BufferLoader(this.context, [paths to wav], callback);
    // in callback, set this.isReady to true (hide UI unless isReady)
    //loader.load();
  },

  actions: {

    toggle: function() {
      this.toggleProperty('isPlaying');
      console.log(this.context);
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
    }

  },

  updateLoopId: function() {
    this.replaceRoute('loop', this.get('model'));
  }

});

App.NoteController = Ember.ObjectController.extend({

  needs: ['loop'],

  actions: {
    click: function() {
      var current = this.get('intensity');
      this.set('intensity', (current + 1) % 3);
      this.get('controllers.loop').updateLoopId();
    }
  }

});

App.Note = Ember.Object.extend({

  intensity: '0',

  icon: function() {
    if (this.get('intensity') === 0)
      return 'fa fa-circle-o fa-2x';
    if (this.get('intensity') === 1)
      return 'fa fa-dot-circle-o fa-2x';
    return 'fa fa-circle fa-2x';
  }.property('intensity')

});

// 00 00 64 00 00
// 00 20 00 20 00 20 00 20
// 00 10 01 01 00 10 00 10
// 10 01 01 01 10 01 11 10
// 22 01 22 01 22 01 22 01
// 00 20 00 20 00 20 00 20
// 00 10 01 01 00 10 00 10
// 10 01 01 01 10 01 11 10
// 22 01 22 01 22 01 22 01

// 00 00 64 00 00 00 20 00 20 00 20 00 20 00 10 01 01 00 10 00 10 10 01 01 01 10 01 11 10 22 01 22 01 22 01 22 01 00 20 00 20 00 20 00 20 00 10 01 01 00 10 00 10 10 01 01 01 10 01 11 10 22 01 22 01 22 01 22 01
// 00AGQAAAAgACAAIAAgABABAQAQABAQAQEBEAERECIBIgEiASIBACAAIAAgACAAEAEBABAAEBABAQEQAREQIgEiASIBIgE=

require('base64');
