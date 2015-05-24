/*
   Copyright 2014 Nebez Briefkani
   floppybird - main.js

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var debugmode = false;

var states = Object.freeze({
    SplashScreen: 0,
    GameScreen: 1,
    ScoreScreen: 2
});

var currentstate;

var highscore = 0;

var pipeheight = 140;

/* set pipe height */
var _avgHeight = 140;
var _avgTemp = 25;
var _prevTemp = null;
socket.on('temperature', function (temp) {
    if (_prevTemp !== null) {
        var diff = (_prevTemp - temp);
        if (diff === 0) {
            pipeheight = (pipeheight > 140) ? pipeheight - 10 : pipeheight + 10;
        } else if (diff < 0) {
            pipeheight -= 10;
        } else {
            pipeheight += 10;
        }
        pipeheight = Math.max(Math.min(pipeheight, 300), 80);
    }
    _prevTemp = temp;
});

var _pipeY = 0;
socket.on('acceleration', function (angles) {
    if (angles.y > 0.1 || angles.y < -0.1) {
        _pipeY = (angles.y + 1) / 2;
    } else {
        _pipeY = 0;
    }
});

var replayclickable = false;

//sounds
var volume = 30;
var hoo = new buzz.sound("assets/sounds/hoooo.ogg");
var soundJump = [
    hoo
];
var soundScore = new buzz.sound("assets/sounds/ho-yeah_point.ogg");
var soundHit = new buzz.sound("assets/sounds/die_ouch.ogg");
var soundDie = new buzz.sound("assets/sounds/game_over_kombat_grave.ogg");
var soundSwoosh = new buzz.sound("assets/sounds/sfx_swooshing.ogg");
var soundReady = new buzz.sound("assets/sounds/ready_set_flyyy.ogg");
buzz.all().setVolume(volume);

//loops
var loopPipeloop;

var _mainPlayer;

$(document).ready(function() {
    if (window.location.search == "?debug")
        debugmode = true;
    if (window.location.search == "?easy")
        pipeheight = 200;

    //get the highscore
    var savedscore = getCookie("highscore");
    if (savedscore != "")
        highscore = parseInt(savedscore);

    _mainPlayer = new Player();

    //start with the splash screen
    showSplash();
    requestAnimationFrame(gameloop);

});

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i].trim();
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function showSplash() {
    currentstate = states.SplashScreen;

    Pipe.reset();

    //update the player in preparation for the next game
    _mainPlayer.restore().update(1);

    soundSwoosh.stop();
    soundSwoosh.play();

    //clear out all the pipes if there are any

    //make everything animated again
    $(".animated").css('animation-play-state', 'running');
    $(".animated").css('-webkit-animation-play-state', 'running');

    //fade in the splash
    $("#splash").transition({
        opacity: 1
    }, 2000, 'ease');
}

var _previousTime;
function startGame() {
    currentstate = states.GameScreen;

    //fade out the splash
    $("#splash").stop();
    $("#splash").transition({
        opacity: 0
    }, 500, 'ease');

    //update the big score
    setBigScore();
    soundReady.stop();
    soundReady.play();
    //debug mode?
    if (debugmode) {
        //show the bounding boxes
        $(".boundingbox").show();
    }

    //start up our loops
    updatePipes();
    _previousTime = window.performance.now();
    loopPipeloop = setInterval(updatePipes, 1400);

    //jump from the start!
    _mainPlayer.start();
}

function gameloop() {
    var diff = window.performance.now() - _previousTime;
    //update the player
    Player.forEach.update(diff / 16);
    _mainPlayer.calcCollision();

    requestAnimationFrame(gameloop);
    _previousTime += diff;
}

//Handle space bar
$(document).keydown(function(e) {
    //space bar!
    if (e.keyCode == 32) {
        //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
        if (currentstate == states.ScoreScreen)
            $("#replay").click();
        else
            screenClick();
    }
});

//Handle mouse down OR touch start
if ("ontouchstart" in window)
    $(document).on("touchstart", screenClick);
else
    $(document).on("mousedown", screenClick);

function screenClick(e) {
    if (event.target.nodeName === 'INPUT') { return; }
    if (currentstate == states.GameScreen) {
        _mainPlayer.jump();
    } else if (currentstate == states.SplashScreen) {
        startGame();
    }
}

function setBigScore(erase) {
    var elemscore = $("#bigscore");
    elemscore.empty();

    if (erase)
        return;

    var digits = _mainPlayer.score.toString().split('');
    for (var i = 0; i < digits.length; i++)
        elemscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setSmallScore() {
    var elemscore = $("#currentscore");
    elemscore.empty();

    var digits = _mainPlayer.score.toString().split('');
    for (var i = 0; i < digits.length; i++)
        elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setHighScore() {
    var elemscore = $("#highscore");
    elemscore.empty();

    var digits = highscore.toString().split('');
    for (var i = 0; i < digits.length; i++)
        elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setMedal() {
    var score = _mainPlayer.score;
    var elemmedal = $("#medal");
    elemmedal.empty();

    if (score < 10)
    //signal that no medal has been won
        return false;

    if (score >= 10)
        medal = "bronze";
    if (score >= 20)
        medal = "silver";
    if (score >= 30)
        medal = "gold";
    if (score >= 40)
        medal = "platinum";

    elemmedal.append('<img src="assets/medal_' + medal + '.png" alt="' + medal + '">');

    //signal that a medal has been won
    return true;
}

function gameOver() {
    //stop animating everything!
    $(".animated").css('animation-play-state', 'paused');
    $(".animated").css('-webkit-animation-play-state', 'paused');

    //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
    currentstate = states.ScoreScreen;

    //destroy our gameloops
    clearInterval(loopPipeloop);
    loopPipeloop = null;

    //mobile browsers don't support buzz bindOnce event
    if (isIncompatible.any()) {
        //skip right to showing score
        showScore();
    } else {
        //play the hit sound (then the dead sound) and then show score
        soundHit.play().bindOnce("ended", function() {
            soundDie.play().bindOnce("ended", function() {
                showScore();
            });
        });
    }
}

function showScore() {
    var score = _mainPlayer.score;
    //unhide us
    $("#scoreboard").css("display", "block");

    //remove the big score
    setBigScore(true);

    //have they beaten their high score?
    if (score > highscore) {
        //yeah!
        highscore = score;
        //save it!
        setCookie("highscore", highscore, 999);
    }

    //update the scoreboard
    setSmallScore();
    setHighScore();
    var wonmedal = setMedal();

    //SWOOSH!
    soundSwoosh.stop();
    soundSwoosh.play();

    //show the scoreboard
    $("#scoreboard").css({
        y: '40px',
        opacity: 0
    }); //move it down so we can slide it up
    $("#replay").css({
        y: '40px',
        opacity: 0
    });
    $("#scoreboard").transition({
        y: '0px',
        opacity: 1
    }, 600, 'ease', function() {
        //When the animation is done, animate in the replay button and SWOOSH!
        soundSwoosh.stop();
        soundSwoosh.play();
        $("#replay").transition({
            y: '0px',
            opacity: 1
        }, 600, 'ease');

        //also animate in the MEDAL! WOO!
        if (wonmedal) {
            $("#medal").css({
                scale: 2,
                opacity: 0
            });
            $("#medal").transition({
                opacity: 1,
                scale: 1
            }, 1200, 'ease');
        }
    });

    //make the replay button clickable
    replayclickable = true;
}

$("#replay").click(function() {
    //make sure we can only click once
    if (!replayclickable)
        return;
    else
        replayclickable = false;
    //SWOOSH!
    soundSwoosh.stop();
    soundSwoosh.play();

    //fade out the scoreboard
    $("#scoreboard").transition({
        y: '-40px',
        opacity: 0
    }, 1000, 'ease', function() {
        //when that's done, display us back to nothing
        $("#scoreboard").css("display", "none");

        //start the game over!
        showSplash();
    });
});

function updatePipes() {
    Pipe.cleanup();

    // new Pipe(Math.random(), pipeheight);
    new Pipe(_pipeY || Math.random(), pipeheight);
}

var isIncompatible = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Safari: function() {
        return (navigator.userAgent.match(/OS X.*Safari/) && !navigator.userAgent.match(/Chrome/));
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isIncompatible.Android() || isIncompatible.BlackBerry() || isIncompatible.iOS() || isIncompatible.Opera() || isIncompatible.Safari() || isIncompatible.Windows());
    }
};
