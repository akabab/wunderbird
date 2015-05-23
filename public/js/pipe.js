var _pipePool = [];

function Pipe(height, space) {
	var div = document.createElement('div'),
		upper = document.createElement('div'),
		lower = document.createElement('div');

    var topHeight = Math.floor((260 - space) * height) + 80; //add lower padding
    var lowerHeight = 420 - space - topHeight;

    console.log(topHeight, lowerHeight);

	div.className = "pipe animated";
	upper.className = "pipe_upper";
	lower.className = "pipe_lower";
	upper.style.height = topHeight +'px';
	lower.style.height = lowerHeight +'px';
	div.appendChild(upper);
	div.appendChild(lower);
	document.getElementById('flyarea').appendChild(div);
	this.upper = upper;
	this.lower = lower;
	this.HTMLElement = div;
	_pipePool.push(this);
}


Pipe.cleanup = function() {
	_pipePool = _pipePool.filter(function (pipe) {
		if ($(pipe.HTMLElement).position().left <= -100) {
			pipe.HTMLElement.remove();
			pipe.HTMLElement = null;
			return false;
		};
		return true;
	})
};


Pipe.reset = function() {
	var i = -1, len = _pipePool.length;
	while (++i < len) {
		_pipePool[i].HTMLElement.remove();
		_pipePool[i].HTMLElement = null;;
	}
	_pipePool = [];
}
