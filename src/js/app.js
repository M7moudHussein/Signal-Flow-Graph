/**
 * Created by mahmoud on 4/14/17.
 */
const DX = 100;
const SIZE = 20;

$(document).ready(function () {
    var graphData = [];

    var flowGraph = new sigma({
        renderer: {
            container: document.getElementById('canvas-division'),
            type: 'canvas'
        },
        settings: {
            autoRescale: true,
            mouseEnabled: true,
            touchEnabled: true,
            nodesPowRatio: 1,
            edgesPowRatio: 1,
            defaultEdgeColor: '#000000',
            defaultNodeColor: '#ff89b9',
            edgeColor: 'default',
            minArrowSize: 5,
            edgeLabelSize: 'proportional'
        }
    });

    $('#add-node').click(function () {
        addNode(graphData);
        updateView(graphData, flowGraph);
    });


    $('#add-edge').click(function () {
        addEdge(graphData);
        updateView(graphData, flowGraph);
    });
    $('#show-forward-paths').click(function () {
        printForwardPaths(getForwardPaths(1, graphData.length, graphData), graphData);
    });

    $('#show-loops').click(function () {
        printLoops(getLoops(graphData), graphData);
    });

    $('#non-touching-loops-btn').click(function () {
        printNonTouchingLoopsGroups(getNonTouchingLoops(graphData, getLoops(graphData)));
    });

    $('#results-btn').click(function () {
        var loops = getLoops(graphData);
        var forwardPaths = getForwardPaths(1, graphData.length, graphData);
        var deltaArray = [];
        var transferFunction = 0;
        for (var i = 0; i < forwardPaths.length; i++) {
            deltaArray.push(evaluateDelta(forwardPaths[i], loops, graphData));
        }
        for (var i = 0; i < forwardPaths.length; i++) {
            transferFunction += evaluatePathGain(forwardPaths[i], graphData) * deltaArray[i];
        }
        deltaArray.push(evaluateDelta([], loops, graphData));
        transferFunction = (transferFunction * 1.0) / deltaArray[deltaArray.length - 1];
        console.log(deltaArray);
        printResult(deltaArray, transferFunction);
    });
});

function addNode(graphData) {
    graphData.push([]);
}

function addEdge(graphData) {
    var source = $('#source-node').val() - 1;
    var target = $('#target-node').val() - 1;
    var gain = $('#edge-gain').val();

    if (!isInt(source) || !isInt(target) || !isFloat(gain) || source >= graphData.length || target >= graphData) {
        return;
    }
    if (graphData[source].hasOwnProperty(target)) {
        graphData[source][target] = (parseFloat(graphData[source][target]) + parseFloat(gain)).toString();
    } else {
        graphData[source][target] = parseFloat(gain).toString();
    }
}

/**
 * gets all the forward paths starting from source node to sink node.
 * @param source the id of the source node.
 * @param sink the id of the sink node.
 * @param graphData 2d array represents the graph.
 * @returns Array 2d list contains the forward paths.
 * */

function getPaths(source, sink, graphData) {
    var forwardPaths = [];
    var visited = [];
    for (var i = 0; i < graphData.length; i++) {
        visited[i] = false;
    }
    var tempPath = [];
    getPathsHelper(source, sink, visited, graphData, tempPath, forwardPaths);
    for (var i = 0; i < forwardPaths.length; i++) {
        if (forwardPaths[i].length <= 1) {
            forwardPaths.splice(i, 1);
            i--;
        }
    }
    return forwardPaths;
}

function getPathsHelper(source, sink, visited, graphData, tempPath, forwardPaths) {
    visited[source] = true;
    tempPath.push(parseInt(source));
    if (source == sink) {
        forwardPaths.push(JSON.parse(JSON.stringify(tempPath)));
    } else {
        for (var key in graphData[source]) {
            if (graphData[source].hasOwnProperty(key)) {
                if (visited[key] == false) {
                    getPathsHelper(key, sink, visited, graphData, tempPath, forwardPaths);
                }
            }
        }
    }
    visited[source] = false;
    tempPath.pop();
}

function getForwardPaths(source, sink, graphData) {
    if (!isInt(source) || !isInt(sink) || source < 0 || source >= graphData.length || sink < 0 || source >= graphData.length) {
        return [];
    }
    source--;
    sink--;
    return getPaths(source, sink, graphData);
}

/**
 * gets all the forward paths starting from source node to sink node.
 * @param graphData an adjacency list represents the graph.
 * @returns Array 2d list represents all the loops.
 * */


function getLoops(graphData) {
    var loops = [];
    for (var i = 0; i < graphData.length; i++) {
        getLoopHelper(i, loops, graphData);
    }
    return loops;
}

function getLoopHelper(source, loops, graphData) {
    var tempPath = [];
    var visited = [];
    var tempLoops = [];
    for (var i = 0; i < graphData.length; i++) {
        visited[i] = false;
    }
    tempPath.push(source);
    for (var key in graphData[source]) {
        if (graphData[source].hasOwnProperty(key)) {
            getPathsHelper(key, source, visited, graphData, tempPath, tempLoops);
        }
    }
    for (var i = 0; i < tempLoops.length; i++) {
        if (tempLoops[i].length <= 1) {
            tempLoops.splice(i, 1);
            i--;
        }
    }
    for (var i = 0; i < tempLoops.length; i++) {
        for (var j = 0; j < tempLoops[i].length; j++) {
            if (tempLoops[i][j] < source) {
                tempLoops.splice(i--, 1);
                break;
            }
        }
    }
    Array.prototype.push.apply(loops, tempLoops);
}


function printForwardPaths(pathsArray, graphData) {
    $('#forward-paths').empty();
    for (var i = 0; i < pathsArray.length; i++) {
        printPath(pathsArray[i], $('#forward-paths'), graphData);
    }
}

function printLoops(pathsArray, graphData) {
    $('#loops').empty();
    for (var i = 0; i < pathsArray.length; i++) {
        printPath(pathsArray[i], $('#loops'), graphData);
    }
}

function printPath(path, label, graphData) {
    var currentText = label.html();
    label.empty();
    for (var i = 0; i < path.length - 1; i++) {
        currentText = currentText + (path[i] + 1) + ' &#x2192;';
    }
    if (path.length !== 0) {
        currentText = currentText + ' ' + (path[path.length - 1] + 1);
    }
    currentText = currentText + '&emsp;(Gain &rArr; ' + evaluatePathGain(path, graphData) + ')' + '<br />';
    label.html(currentText);
}

function updateView(graphData, flowGraph) {
    flowGraph.graph.clear();
    for (var i = 0; i < graphData.length; i++) {
        var x = (flowGraph.graph.nodes().length == 0) ? $('#canvas-division').position().left : flowGraph.graph.nodes()[flowGraph.graph.nodes().length - 1].x;
        var x = x + DX;
        var y = $('#canvas-division').position().top + $('#canvas-division').height() / 2;
        flowGraph.graph.addNode({
            id: 'n' + i,
            x: x,
            y: y,
            size: SIZE,
            label: 'x' + (i + 1)
        });
    }
    for (var i = 0; i < graphData.length; i++) {
        for (var key in graphData[i]) {
            if (graphData[i].hasOwnProperty(key)) {
                flowGraph.graph.addEdge({
                    id: 'e' + flowGraph.graph.edges().length,
                    source: 'n' + i,
                    target: 'n' + key,
                    label: graphData[i][key],
                    type: 'curvedArrow'
                });
            }
        }
    }
    flowGraph.refresh();
}

function printNonTouchingLoopsGroups(groups) {
    var table = $('#loops-table');
    table.empty();
    var content = '';
    for (var i = 0; i < groups.length; i++) {
        for (var j = 0; j < groups[i].length; j++) {
            content = content + '<tr>';
            content = content + '<td>';
            for (var k = 0; k < groups[i][j].length; k++) {
                content = content + getPathReadyToPrint(groups[i][j][k]);
                if (k < groups[i][j].length - 1) {
                    content = content + '<br>';
                }
            }
            content = content + '</td></tr>';
        }
    }
    table.html(content);
}

function getPathReadyToPrint(path) {
    var currentText = '';
    for (var i = 0; i < path.length - 1; i++) {
        currentText = currentText + (path[i] + 1) + ' &#x2192;';
    }
    if (path.length !== 0) {
        currentText = currentText + ' ' + (path[path.length - 1] + 1);
    }
    return currentText;
}

function getNonTouchingLoops(graphData, loops) {
    var nonTouchingLoopsGroups = [];
    for (var i = 1; i < graphData.length; i++) {
        var temp = [];
        getNonTouchingLoopsHelper(0, i, loops, [], temp);
        if (temp.length != 0) {
            nonTouchingLoopsGroups.push(temp);
        }
    }
    return nonTouchingLoopsGroups;
}

function getNonTouchingLoopsHelper(index, n, loops, tempCombination, combinations) {
    if (index == loops.length) {
        if (n == 0) {
            combinations.push(JSON.parse(JSON.stringify(tempCombination)));
        }
        return;
    }
    if (canTakeLoop(tempCombination, loops[index])) {
        tempCombination.push(loops[index]);
        getNonTouchingLoopsHelper(index + 1, n - 1, loops, tempCombination, combinations);
        tempCombination.pop();
    }
    getNonTouchingLoopsHelper(index + 1, n, loops, tempCombination, combinations);
}


function canTakeLoop(tempCombination, loop) {
    for (var i = 0; i < tempCombination.length; i++) {
        for (var j = 0; j < loop.length; j++) {
            if ($.inArray(loop[j], tempCombination[i]) != -1) {
                return false;
            }
        }
    }
    return true;
}

function isInt(temp) {
    return temp == parseInt(temp);
}

function isFloat(temp) {
    return temp == parseFloat(temp);
}

function openCity(evt, cityName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(cityName).style.display = "block";
    evt.currentTarget.className += " active";
}

function evaluateDelta(currentForwardPath, loops, graphData) {
    var neededLoops = [];
    for (var i = 0; i < loops.length; i++) {
        if (!intersect(currentForwardPath, loops[i])) {
            neededLoops.push(loops[i]);
        }
    }
    var groups = getNonTouchingLoops(graphData, neededLoops);
    console.log(groups);
    return evaluateDeltaHelper(groups, graphData);
}

function evaluateDeltaHelper(groups, graphData) {
    var ans = 1;
    for (var i = 0; i < groups.length; i++) {
        var temp = evaluateDeltaHelperOfHelper(groups[i], graphData);
        if (i % 2 == 0) {
            ans = ans - temp;
        } else {
            ans = ans + temp;
        }
    }
    return ans;
}

function evaluateDeltaHelperOfHelper(combinations, graphData) {
    var ans = 0;
    for (var i = 0; i < combinations.length; i++) {
        var temp = 1;
        for (var j = 0; j < combinations[i].length; j++) {
            temp *= evaluatePathGain(combinations[i][j], graphData);
        }
        ans += temp;
    }
    return ans;
}

function evaluatePathGain(path, graphData) {
    var pathGain = 1;
    for (var i = 0; i < path.length - 1; i++) {
        pathGain *= parseFloat(graphData[path[i]][path[i + 1]]);
    }
    return pathGain;
}

function intersect(path1, path2) {
    var temp = new Set(path1);
    for (var i = 0; i < path2.length; i++) {
        if (temp.has(path2[i])) {
            return true;
        }
    }
    return false;
}

function printResult(deltaArray, transferFunction) {
    $('#results').empty();
    var content = '';
    for (var i = 0; i < deltaArray.length - 1; i++) {
        content += '&Delta;' + (i + 1) + ' = ' + deltaArray[i] + '<br>';
    }
    content += '&Delta; = ' + deltaArray[deltaArray.length - 1] + '<br>';
    content += 'T.F = ' + transferFunction;
    $('#results').html(content);
}
