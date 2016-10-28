
// Commify a string that has a single integer or float within it. Can be "3434345 C is hot" or something, not just pure number.
function commify(str) {
  return str.split('').reverse().join('').replace(/(\d{3,3})(?=\d)(?!\d*\.)/g,"$1,").split('').reverse().join('') ;
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null ;
}
