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


/*
  A simple diff implementation for highlighting changed lines.
  Based on:
  * https://github.com/kpdecker/jsdiff
  * http://citeseerx.ist.psu.edu/viewdoc/summary?doi=10.1.1.4.6927
    "An O(ND) Difference Algorithm and its Variations" (Myers, 1986)
*/

var Diff = {};

Diff.splitLines = function(content) {
    // Split string into lines, keeping line numbers, but disregarding
    // unnecessary whitespace

    if (content === '')
        return [];

    // Collapse spaces NOT at the beginning of line
    // (leave these because it's often case with braces, and confuses the
    // engine into showing uglier edit script)
    content = content.replace(/([^\t\n ])[\t ]+/g, '$1 ');
    // Trim spaces at the end of line
    content = content.replace(/ +$/mg, '');

    return content.split(/\r?\n/);

};

Diff.findChanges = function(oldTokens, newTokens) {
    // Diff two arrays, returning string of the form '00--++00'

    var maxEditLength = oldTokens.length + newTokens.length;

    // bestPath[k] is a best path at diagonal k (x-y == k)
    var bestPath = {};
    bestPath[0] = {x: -1, y: -1, changes: ''};

    function advance(path) {
        while(path.x+1 < oldTokens.length && path.y+1 < newTokens.length &&
              oldTokens[path.x+1] == newTokens[path.y+1]) {
            path.x++;
            path.y++;
            path.changes += '0';
        }
    }

    advance(bestPath[0]);
    if (bestPath[0].x == oldTokens.length-1 && bestPath[0].y == newTokens.length-1)
        return bestPath[0].changes;

    for (var d = 1; d <= maxEditLength; d++) {
        for (var k = -d; k <= d; k += 2) {
            // Find a best subsequence with d edits at diagonal k.

            var path = {};
            if (bestPath[k+1] !== undefined && (bestPath[k-1] === undefined ||
                                                bestPath[k-1].x < bestPath[k+1].x)) {
                path.x = bestPath[k+1].x;
                path.y = bestPath[k+1].y+1;
                path.changes = bestPath[k+1].changes + '+';
            } else if (bestPath[k-1] !== undefined) {
                path.x = bestPath[k-1].x+1;
                path.y = bestPath[k-1].y;
                path.changes = bestPath[k-1].changes + '-';
            } else {
                continue;
            }
            advance(path);
            bestPath[k] = path;

            if (path.x == oldTokens.length-1 && path.y == newTokens.length-1) {
                // We've reached the end of both strings.

                // HACK: Try now a super-simple algorithm for strings of equal
                // length. It works for strings with modifications only, and
                // the results are prettier.
                var simpleChanges = Diff.simpleFindChanges(d, oldTokens, newTokens);

                if (simpleChanges !== null)
                    return simpleChanges;
                else
                    return path.changes;
            }
        }
    }
};

Diff.simpleFindChanges = function(maxEditLength, oldTokens, newTokens) {
    /*
      "Gogolewski's diff" (Krzysztof's idea). An algorithm that compares
      tokens one-by one and returns an edit script. Produces less confusing
      output for runs of equal tokens, where nothing has been added or
      removed.

      Returns null when number of changes found > maxEditLength, or when token
      arrays are not of equal length.
    */

    if (oldTokens.length != newTokens.length)
        return null;

    var d = 0;
    var changes = '';
    var i = 0;
    while (i < oldTokens.length) {
        if (oldTokens[i] == newTokens[i]) {
            changes += '0';
            i++;
        } else {
            // Build the chunk. We want it to be of the form '---+++', so we
            // can't just compare it line by line.

            var end; // end of difference
            for (end = i+1; end < oldTokens.length && oldTokens[end] != newTokens[end]; end++)
                ;
            var length = end - i; // length of difference

            d += length*2;
            if (d > maxEditLength)
                return null;

            var k;
            for (k = 0; k < length; k++)
                changes += '-';
            for (k = 0; k < length; k++)
                changes += '+';
            i += length;
        }
    }
    return changes;
};


Diff.analyze = function(template, solution) {
    /*
      Compare solution to template, returning
        {nChanged, highlightChanged, highlightRemoved}
      where highlightChanged and highlightRemoved are lists of line numbers to
      highlight in solution.
    */

    var oldLines = Diff.splitLines(template);
    var newLines = Diff.splitLines(solution);
    var changes = Diff.findChanges(oldLines, newLines);
    var nChanged = 0;
    var highlightChanged = [], highlightRemoved = [];
    var posOld = 0, posNew = 0;
    while (changes !== '') {
        var m = /^(-*)(\+*)/.exec(changes);
        if (m[0].length > 0) {
            var n = m[0].length, nRemoved = m[1].length, nAdded = m[2].length;
            var nRemovedNoEmpty = nRemoved, nAddedNoEmpty = nAdded;

            var i;
            for (i = 0; i < nAdded; i++) {
                if (newLines[posNew+i] !== '')
                    highlightChanged.push(posNew+i);
                else
                    nAddedNoEmpty--;
            }
            for (i = 0; i < nRemoved; i++) {
                if (oldLines[posOld+i] === '')
                    nRemovedNoEmpty--;
            }

            if (nAddedNoEmpty === 0 && nRemovedNoEmpty > 0)
                highlightRemoved.push(posNew);

            posOld += nRemoved;
            posNew += nAdded;
            nChanged += Math.max(nAddedNoEmpty, nRemovedNoEmpty);
            changes = changes.slice(n);
        } else {
            m = /^0*/.exec(changes);
            var nSame = m[0].length;
            posOld += nSame;
            posNew += nSame;
            changes = changes.slice(nSame);
        }
    }

    return {
        nChanged: nChanged,
        highlightChanged: highlightChanged,
        highlightRemoved: highlightRemoved
    };
};
