/* FARM v2.0
Karlis Lukstins <karlis.lukstins@gmail.com>
29.12.2013

Rewrite of the structure
*/

"use strict";
var FarmMemory = function (options) {

  var fm = this;

  fm.config = {
    images_path: "assets/animals/",
    images_path_round: "assets/animals/small/",
    //sounds_path: "assets/sounds/", // Funny sounds
    sounds_path: "assets/voice/en/", // English

    animals: ["cow", "pig", "cat", "dog", "mouse", "bird", "duck", "rooster", "sheep"],
    image_format: ".png",
    sound_format: ".mp3",

    red_glow: "red_glow",
    blue_glow: "blue_glow",
    green_glow: "green_glow",

  };

  fm.screens = {
    about_screen: "about_screen",
    game_screen: "game_screen",
    comp_screen: "comp_screen",
    end_screen: "end_screen",
    dialog: "dialog",
    active: "comp_screen"
  };

  fm.memory = {
    sequence: null,
    progress: null,
    user_input: true,
    random_animals: null,
    add_step_timeout: null,
  };

  fm.audio = {
    context: null,
    source: null,
    buffers: {},

    fetch: function () {
      var request = new XMLHttpRequest();
      for (var i = 0, len = fm.config.animals.length; i < len; i++) {
        request = new XMLHttpRequest();

        request._soundName = fm.config.animals[i];
        request.open('GET', fm.config.sounds_path + request._soundName + fm.config.sound_format, true);
        request.responseType = 'arraybuffer';
        request.addEventListener('load', fm.audio.buffer, false);
        request.send();
      }
    },

    buffer: function(event) {
      var request = event.target;
      var buffer = fm.audio.context.createBuffer(request.response, false);
      fm.audio.buffers[request._soundName] = buffer;
    },

    play: function(animal) {
      var source = fm.audio.context.createBufferSource();
      source.buffer = fm.audio.buffers[animal];
      source.connect(fm.audio.context.destination);
      source.start(0);
    }
  }

  if (options){
    for (var prop in options) {
      stp.config[prop] = options[prop];
    }
  }


  fm.init = function(){

    // onResize :
    var supportsOrientationChange = "onorientationchange" in window, orientationEvent = supportsOrientationChange ? "orientationchange" : "resize";
    window.addEventListener(orientationEvent, function () { onresizeFunc(); }, false);
    onresizeFunc();


    // setup buttons
    $("#menu_new").on("click", function(){
      if (fm.memory.user_input) fm.init_game();
    });
    $("#play_again_button").on("click", function(){
      fm.init_game();
    });
    $("#menu_comp").on("click", function(){
      fm.screen(fm.screens.comp_screen);
    });
    $("#menu_about").on("click", function(){
      fm.screen(fm.screens.about_screen);
    });

    // Change animal backgrounds
    for (var i = 0; i < 9; i++) {
      document.getElementById("animalcircle_"+i).style.background = "url(" + fm.config.images_path_round + fm.config.animals[i] + fm.config.image_format + ")";
    }

    // Attach "compose" to fm.compose_input()
    $(".animal_circle").click( function(e) {
      e.preventDefault();
      fm.compose_input($(this));
    });

    // Setup audio
    if('webkitAudioContext' in window) {
        fm.audio.context = new webkitAudioContext();
        fm.audio.fetch();
    } else {
      console.log("TODO::Add html5 audio api");

      /*
        var html5SoundChannels = [];

        if (html5SoundChannels[file]){
          var audio = new Audio(file);
          if (loops)
              audio.loop = "true";
          audio.volume = volume;
          audio.preload = "auto";
          html5SoundChannels[file] = audio;
          html5SoundChannels[file].play();
        } else {
          html5SoundChannels[file].play();
        }
    */
    }

  } // INIT

  fm.compose_input = function(animal_div){
    var animal = parseInt(animal_div.attr("id").split("_")[1]);

    // Glow and Play
    fm.glow_div(animal_div.attr("id"), fm.config.green_glow);
    fm.audio.play( fm.config.animals[animal] );
  }

  fm.glow_div = function(div,glow_type) {
    $("#"+div).addClass(glow_type);
    setTimeout(function() {
      $("#"+div).removeClass(glow_type);
    }, (500));
  }

  fm.init_game = function() {
    fm.memory.user_input = false;

    // select animals
    fm.memory.random_animals =  [0,1,2,3,4,5,6,7,8];
    fm.memory.random_animals.sort(function() {return 0.5 - Math.random()}); //randomize

    // Setup game background and inputs -> fm.setup_game()
    for (var i = 0; i < 4; i++) {
      document.getElementById("game_"+i).style.background = "url(" + fm.config.images_path + fm.config.animals[fm.memory.random_animals[i]] + fm.config.image_format + ")";
    }

    $(".touch_tile").click(function(e){
      e.preventDefault();
      if(fm.memory.user_input) {
        fm.game_input($(this).attr("id"));
      }
    });

    // change mode
    fm.screen(fm.screens.game_screen);
    fm.memory.sequence = [];
    fm.dots.empty();

    // play first animal      //toggle_wait(true);
    setTimeout(function() {
      fm.game_add_step(fm.memory.sequence);
    }, (300));
  }

  fm.game_add_step = function(song) { //Each round
    var step = Math.floor(Math.random() * 4);
    if (step == 4){
      console.log("You won - random function returned '1'");
      // TODO:: Implement transfer_funds();
      step = 3;
    }
    song.push(step);
    fm.dots.add_dot();

    $("#"+fm.screens.game_screen).addClass("playing");
    fm.memory.progress = 0;
    fm.play_sequence(song); // play seq
  }

  fm.play_sequence = function(sequence) {
    var progress = fm.memory.progress;
    if (progress == fm.memory.sequence.length) { // while less play

      fm.memory.user_input = true;

      $("#"+fm.screens.game_screen).removeClass("playing");
      fm.memory.progress = 0;

    } else {
      // Glow and play
      fm.glow_div("game_" + sequence[progress], fm.config.blue_glow);
      fm.audio.play( fm.config.animals[fm.memory.random_animals[sequence[progress]]]);

      fm.memory.progress++;
      setTimeout(function() {
        fm.play_sequence(sequence);
      }, (1000));
    }
  }

  fm.screen = function(new_screen) {
    if (fm.screens.active != new_screen) {  // do nothing if we are already there.
      document.getElementById(fm.screens.active).style.display = "none";
      document.getElementById(new_screen).style.display = "block";
      fm.screens.active = new_screen;
    };
  }

  fm.dots = {
    dots_container: $("#game_dots"),
    add_dot: function(){
      var dot = document.createElement("div");
      dot.setAttribute('class',"dot");
      fm.dots.dots_container.append(dot);
      fm.dots.position();
    },
    position: function() {
      var children = fm.dots.dots_container.children().length;
      var margin_left = (25 * children) / 2;
      fm.dots.dots_container.css({"margin-left": -margin_left });
    },
    empty: function() {
      fm.dots.dots_container.html("");
    },
  }


  fm.game_input = function (animal_id) {
    fm.memory.user_input = false;

    var animal = animal_id.split("_")[1];
    if (animal == fm.memory.sequence[fm.memory.progress]) {
      fm.glow_div(animal_id, fm.config.green_glow);
      fm.audio.play(fm.config.animals[fm.memory.random_animals[animal]])
      fm.memory.progress++;
      if (fm.memory.progress == fm.memory.sequence.length) {
        setTimeout(function() {fm.game_add_step(fm.memory.sequence);}, (900));
      } else {
        // WORKAROUND to use timeout
        setTimeout(function() { fm.memory.user_input = true}, (100));
      }
    } else {      // game over
      fm.glow_div(animal_id, fm.config.red_glow);
      fm.audio.play(fm.config.animals[fm.memory.random_animals[animal]])
      setTimeout(function() { fm.screen(fm.screens.end_screen); document.getElementById("steps").innerHTML = fm.memory.sequence.length-1;}, (1100));
    };
  }


  // screen resize function
  function onresizeFunc(){ // Do all the resising here...
    document.getElementById("comp_screen").style.width = document.body.clientWidth - 100;
    document.getElementById("game_screen").style.width = document.body.clientWidth - 100;
  }

}
