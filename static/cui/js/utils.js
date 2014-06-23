
function xml_to_string(xml_node)
{
    if (typeof xml_node == "undefined")
        return "";
    if (typeof xml_node.xml == "undefined")
        return "";
    else if (XMLSerializer) {
        var xml_serializer = new XMLSerializer();
        return xml_serializer.serializeToString(xml_node);
    }
    else {
        return "";
    }
}

function xmlNodeValue(xml, path) {
    var result = '';
    result = $(xml).find(path).text();
    return result;
}


// http://stackoverflow.com/a/2880929/78145

// Parse URI parameters, e.g.
// getParams("x=y&z=w") -> {x: 'y', z: 'w'}
function getParams(query) {
    if (query === undefined)
        query = window.location.search.substring(1);

    var match;
    var pl = /\+/g;  // Regex for replacing addition symbol with a space
    var search = /([^&=]+)=?([^&]*)/g;
    var decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); };
    var params = {};

    while ((match = search.exec(query)))
        params[decode(match[1])] = decode(match[2]);
    return params;
}
