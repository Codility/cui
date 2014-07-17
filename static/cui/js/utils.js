/*!

    Copyright (C) 2014 Codility Limited. <https://codility.com>

    This file is part of Candidate User Interface (CUI).

    CUI is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version accepted in a public statement
    by Codility Limited.

    CUI is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with CUI.  If not, see <http://www.gnu.org/licenses/>.

*/


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
