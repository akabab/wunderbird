var socket = io();

$('.device').on('click', function () {
    var id = $(this).attr('id');
    socket.emit('device', id);
});

socket.on('device-status', function (o) {
    var name = o.name;
    var status = o.status;
    var Element = $('#' + name + ' .status');
    Element.toggleClass('active', status);
    Element.text(status ? 'On' : 'Off');
});

socket.on('device-value', function (o) {
    // console.log(o);
    var name = o.name;
    var value = o.value;
    var Element = $('#' + name + ' .value');
    Element.text(value ? value : 'null');
});
