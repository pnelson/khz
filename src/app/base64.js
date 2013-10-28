window.hexToBase64 = function(data) {
  var hex = data.replace(/\r|\n/g, '')
                .replace(/([a-fA-F0-9]{2})/g, '0x$1 ')
                .replace(/ +$/, '')
                .split(' ');
  return btoa(String.fromCharCode.apply(null, hex));
};

window.base64ToHex = function(data) {
  var rv = [];
  var base64 = data.replace(/[ \r\n]+$/, '');
  var binary = atob(base64);
  for (var i = 0; i < binary.length; i++) {
    var hex = binary.charCodeAt(i).toString(16);
    if (hex.length === 1)
      hex = '0' + hex;
    rv[rv.length] = hex;
  }
  return rv.join('');
};
