var _playerPool = [], _uuids = {}, _gameDiv = document.getElementById('flyarea');

function Player(uuid) {
	var div, box;
	this.id = _playerPool.length;
	box = document.createElement('div');
	box.className = "boundingbox";
	div = document.createElement('div');
	div.className = "bird animated";
	div.id = "player-" + this.id;
	document.body.appendChild(box);
	_gameDiv.appendChild(div);
	this.box = box;
	this.HTMLElement = div;
	this.restore();
    this.uuid = uuid;
    _uuids[uuid] = this;
	_playerPool.push(this);
}

Player.prototype.$ = function() {
    return $(this.HTMLElement);
}

Player.prototype.addScore = function() {
	this.score++;
	if (this.id === 0) {
    	soundScore.stop();
	    soundScore.play();
	    setBigScore();
	}
};

Player.prototype.die = function() {
    var playerbottom = this.$().position().top + this.$().width(); //we use width because he'll be rotated 90 deg
    var floor = $(_gameDiv).height();
    var movey = Math.max(0, floor - playerbottom);
    this.$().transition({
        y: movey + 'px',
        rotate: 90
    }, 1000, 'easeInOutCubic');
	if (this.isMain()) {
		gameOver();
	} else {
		soundHit.play(); // lower sound lvl for other players mby ?
	}
};

Player.prototype.emit = function(action) {
    socket.emit(action, this.uuid);
};

Player.prototype.isMain = function() {
    return this.id === 0;
}

Player.prototype.jump = function() {
    this.velocity = -4.6;
    //play jump sound
    soundJump.stop();
    soundJump.play();
    if (this.isMain()) {
        this.emit('jump');
    }
};

Player.prototype.restore = function() {
	this.rotation = 0;
    this.velocity = 0;
    this.position = 180;
    this.rotation = 0;
    this.score = 0;
	this.$().css({
		y: 0,
		x: 25
	});
    return this;
};

Player.prototype.update = function(diff) {
	this.velocity += 0.25 * diff; // gravity
	this.position += this.velocity;
	this.rotation = Math.min((this.velocity / 10) * 90, 90);
    this.$().css({
        rotate: this.rotation,
        top: this.position
    });
    return this;
};

Player.prototype.calcCollision = function() {
    //create the bounding box
    var box = this.HTMLElement.getBoundingClientRect();
    var origwidth = 34.0;
    var origheight = 24.0;

    var boxwidth = origwidth - (Math.sin(Math.abs(this.rotation) / 90) * 8);
    var boxheight = (origheight + box.height) / 2;
    var boxleft = ((box.width - boxwidth) / 2) + box.left;
    var boxtop = ((box.height - boxheight) / 2) + box.top;
    var boxright = boxleft + boxwidth;
    var boxbottom = boxtop + boxheight;

    //if we're in debug mode, draw the bounding box
    if (debugmode) {
        this.box.css('left', boxleft);
        this.box.css('top', boxtop);
        this.box.css('height', boxheight);
        this.box.css('width', boxwidth);
    }

    //did we hit the ground?
    if (box.bottom >= $("#land").offset().top) {
        this.die();
        return;
    }

    //have they tried to escape through the ceiling? :o
    var ceiling = $("#ceiling");
    if (boxtop <= (ceiling.offset().top + ceiling.height()))
        this.position = 0;

    //we can't go any further without a pipe
    var pipes = _pipePool;
    if (pipes[0] == null)
        return;

    //determine the bounding box of the next pipes inner area
    var nextpipeupper = $(pipes[0].upper);

    var pipetop = nextpipeupper.offset().top + nextpipeupper.height();
    var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
    var piperight = pipeleft + 52;
    var pipebottom = pipetop + pipeheight;

    if (debugmode) {
        var boundingbox = $("#pipebox");
        boundingbox.css('left', pipeleft);
        boundingbox.css('top', pipetop);
        boundingbox.css('height', pipeheight);
        boundingbox.css('width', 52);
    }

    //have we gotten inside the pipe yet?
    if (boxright > pipeleft) {
        //we're within the pipe, have we passed between upper and lower pipes?
        if (boxtop > pipetop && boxbottom < pipebottom) {
            //yeah! we're within bounds

        } else {
            //no! we touched the pipe
            this.die();
            return;
        }
    }

    //have we passed the imminent danger?
    if (boxleft > piperight) {
        //yes, remove it
        pipes.splice(0, 1);

        //and score a point
        _mainPlayer.addScore();
    }
    return this;
};

Player.forEach = {};
Object.keys(Player.prototype).forEach(function (key) {
	Player.forEach[key] = function () {
		var i = -1, len = _playerPool.length;
		while (++i < len) {
			_playerPool[i][key].apply(_playerPool[i], arguments);
		}
		return Player;
	};
});

Player.getPlayerPool = function () {
	return _playerPool;
}

socket.on('peer-left', function (uuid) {
    _uuids[uuid].die(); // should cleanup
});
socket.on('peer-join', function (uuid) {
    new Player(uuid);
});

socket.on('jump', function (uuid) {
    console.log('player#'+ uuid, " jumped !")
    _uuids[uuid].jump();
});

socket.on('start', function (uuid) {
    console.log('player#'+ uuid, " started !")
    _uuids[uuid].restore();
});

socket.on('die', function (uuid) {
    console.log('player#'+ uuid, " died !")
    _uuids[uuid].die();
});

socket.on('pseudo', function (o) {
    _uuids[o.uuid].pseudo = o.pseudo;
});

