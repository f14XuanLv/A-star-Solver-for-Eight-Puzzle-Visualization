// 节点列表，用于存储所有节点
const nodeList = [];

// 全局 open 表和 close 表，只存储索引
const globalOpenList = [];
const globalCloseList = new Set();

// 状态映射，用于快速查找状态是否已被访问
const stateMap = {};

// 在添加新节点后插入并排序
function insertIntoOpenList(index) {
    globalOpenList.push(index);
    globalOpenList.sort((a, b) => nodeList[a].fn - nodeList[b].fn);
}

const targetStateData = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 固定的目标状态

// 判断状态是否可解
function isSolvable(state) {
    let inversions = 0;
    const array = state.filter(n => n !== 0);
    for (let i = 0; i < array.length - 1; i++) {
        for (let j = i + 1; j < array.length; j++) {
            if (array[i] > array[j]) inversions++;
        }
    }
    return inversions % 2 === 0;
}

// 随机生成可解的初始状态
function shuffleState(state, moves = 100) {
    const stateCopy = state.slice();
    for (let i = 0; i < moves; i++) {
        const zeroIndex = stateCopy.indexOf(0);
        const possibleMoves = [];
        if (zeroIndex % 3 > 0) { // 可以向左移动
            possibleMoves.push(zeroIndex - 1);
        }
        if (zeroIndex % 3 < 2) { // 可以向右移动
            possibleMoves.push(zeroIndex + 1);
        }
        if (Math.floor(zeroIndex / 3) > 0) { // 可以向上移动
            possibleMoves.push(zeroIndex - 3);
        }
        if (Math.floor(zeroIndex / 3) < 2) { // 可以向下移动
            possibleMoves.push(zeroIndex + 3);
        }
        const target = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
        [stateCopy[zeroIndex], stateCopy[target]] = [stateCopy[target], stateCopy[zeroIndex]];
    }
    return stateCopy;
}

function generateSolvableState() {
    let state;
    do {
        state = shuffleState(targetStateData);
    } while (!isSolvable(state));
    return state;
}

const initStateData = generateSolvableState(); // 随机生成可解的初始状态

// 节点类
class Node {
    constructor(stateValue, parentIndex) {
        this.stateValue = stateValue;
        this.parent = parentIndex; // 父节点索引
        this.children = []; // 子节点索引
        this.gn = 0;
        this.hn = 0;
        this.fn = 0;
        this.ifOpt = false; // 是否为最优路径经过的节点
        this.optId = null;  // 最优状态 id
        this.openList = []; // 当前状态的open表，作用只是记录，后续用来可视化算法的动态化过程会用到
        this.closeList = []; // 当前状态的close表，作用只是记录，后续用来可视化算法的动态化过程会用到
    }

    // 计算 gn
    calculateGn() {
        if (this.parent !== null && this.parent !== undefined) {
            this.gn = nodeList[this.parent].gn + 1;
        } else {
            this.gn = 0;
        }
    }

    // 曼哈顿距离计算 hn
    calculateHn() {
        let hn = 0;
        for (let i = 0; i < 9; i++) {
            if (this.stateValue[i] === 0) continue;
            const targetIndex = targetStateData.indexOf(this.stateValue[i]);
            hn += Math.abs(Math.floor(i / 3) - Math.floor(targetIndex / 3)) + Math.abs(i % 3 - targetIndex % 3);
        }
        this.hn = hn;
    }

    // 计算 fn
    calculateFn() {
        this.fn = this.gn + this.hn;
    }
}

// 初始化根节点
const rootNode = new Node(initStateData, null);
nodeList.push(rootNode);

// 计算根节点的 gn, hn, fn
rootNode.calculateGn();
rootNode.calculateHn();
rootNode.calculateFn();

// 添加根节点索引到 open 表
insertIntoOpenList(0); // 根节点在 nodeList 中的索引为 0

// 添加根节点状态到 stateMap
stateMap[rootNode.stateValue.toString()] = 0;

// 判断目标状态
function isGoalState(state) {
    return state.toString() === targetStateData.toString();
}

// 生成后继节点
function generateSuccessors(currentIndex) {
    const successors = [];
    const currentNode = nodeList[currentIndex];
    const state = currentNode.stateValue;
    const zeroIndex = state.indexOf(0);
    const possibleMoves = [];

    if (zeroIndex % 3 > 0) { // 可以向左移动
        possibleMoves.push(zeroIndex - 1);
    }
    if (zeroIndex % 3 < 2) { // 可以向右移动
        possibleMoves.push(zeroIndex + 1);
    }
    if (Math.floor(zeroIndex / 3) > 0) { // 可以向上移动
        possibleMoves.push(zeroIndex - 3);
    }
    if (Math.floor(zeroIndex / 3) < 2) { // 可以向下移动
        possibleMoves.push(zeroIndex + 3);
    }

    for (let move of possibleMoves) {
        const newState = state.slice();
        [newState[zeroIndex], newState[move]] = [newState[move], newState[zeroIndex]];
        const successorNode = new Node(newState, currentIndex); // 传递父节点索引

        successorNode.calculateGn();
        successorNode.calculateHn();
        successorNode.calculateFn();

        successors.push(successorNode);
    }

    return successors;
}

function constructOptimalPath(nodeIndex) {
    let optId = 0;
    let currentNodeIndex = nodeIndex;

    const optList = [];

    while (currentNodeIndex !== null && currentNodeIndex !== undefined) {
        const node = nodeList[currentNodeIndex];
        node.ifOpt = true;
        node.optId = optId++;
        optList.push(currentNodeIndex);
        currentNodeIndex = node.parent;
    }

    optList.reverse();

    // 给nodeList中的optId赋值
    optList.forEach((value, index) => {
        nodeList[value].optId = index;
    });

    return optList;
}

// A* 搜索算法
function aStarSearch() {
    while (globalOpenList.length > 0) {
        // 从 open 表中取出 fn 最小的节点
        const currentIndex = globalOpenList.shift();
        const currentNode = nodeList[currentIndex];

        // 如果当前节点是目标状态，构建路径并返回
        if (isGoalState(currentNode.stateValue)) {
            console.log('找到目标状态');
            const optList = constructOptimalPath(currentIndex);
            return optList;
        }

        // 将当前节点加入 close 表
        globalCloseList.add(currentIndex);

        // **在这里记录当前节点的 openList 和 closeList**
        currentNode.openList = globalOpenList.slice(); // 复制当前的 openList
        currentNode.closeList = Array.from(globalCloseList); // 复制当前的 closeList

        // 生成后继节点
        const successors = generateSuccessors(currentIndex);

        for (let successor of successors) {
            const successorStateStr = successor.stateValue.toString();
            const existingIndex = stateMap[successorStateStr];

            if (existingIndex === undefined) {
                // 新状态
                // 添加到 nodeList
                const successorIndex = nodeList.length;
                nodeList.push(successor);

                // 添加到 open 表
                insertIntoOpenList(successorIndex);

                // 添加到 stateMap
                stateMap[successorStateStr] = successorIndex;

                // 添加到父节点的 children
                nodeList[currentIndex].children.push(successorIndex);

                // **在这里记录 successor 的 openList 和 closeList**
                successor.openList = globalOpenList.slice();
                successor.closeList = Array.from(globalCloseList);

            } else {
                // 状态已存在，检查是否需要更新
                const existingNode = nodeList[existingIndex];

                if (successor.gn < existingNode.gn) {
                    // 更新 existingNode 的父节点和代价
                    console.log('节点:', existingIndex, '父节点变化:', existingNode.parent , '->', currentIndex);
                    nodeList[existingNode.parent].children = nodeList[existingNode.parent].children.filter(child => child !== existingIndex);
                    existingNode.parent = currentIndex;
                    existingNode.gn = successor.gn;
                    existingNode.fn = existingNode.gn + existingNode.hn;

                    // 添加到父节点的 children
                    nodeList[currentIndex].children.push(existingIndex);

                    // 如果 existingNode 在 close 表中，移回 open 表
                    if (globalCloseList.has(existingIndex)) {
                        globalCloseList.delete(existingIndex);
                        insertIntoOpenList(existingIndex);
                    }
                }
            }
        }
    }

    console.log('未找到可行解');
    return null;
}

// 执行搜索
const optList = aStarSearch();
minSteps = optList.length - 1;
console.log('最优路径:', optList);
console.log('节点列表:', nodeList);

let totalTreeNodeCount = 0;

// 生成树形数据
function generateTreeData(nodeIndex, visited = new Set(), parentIndex = null) {
    if (visited.has(nodeIndex)) {
        return null; // 防止重复访问
    }
    visited.add(nodeIndex);

    totalTreeNodeCount++;

    const node = nodeList[nodeIndex];
    const treeNode = {
        index: nodeIndex,
        children: []
    };

    for (let childIndex of node.children) {
        const childTreeNode = generateTreeData(childIndex, visited, nodeIndex);
        if (childTreeNode) {
            treeNode.children.push(childTreeNode);
        }
    }

    return treeNode;
}

// 添加变量来跟踪当前最深层级和每层节点数
let currentMaxDepth = 0;
let depthNodeCounts = {};
let maxNodesPerLevel = 0;

// 生成完整的树形数据
const treeData = generateTreeData(0);
console.log('树形数据:', treeData);
console.log('总节点数:', totalTreeNodeCount);

var svg = d3.select("svg"),
    width = window.innerWidth,
    height = window.innerHeight;

var g = svg.append("g");

var zoom = d3.zoom()
    .scaleExtent([0.05, 2])
    .on("zoom", function(event) {
        g.attr("transform", event.transform);
    });

svg.call(zoom);

// 修改tree布局函数，使其成为可更新的变量
var treeLayout = d3.tree()
    .size([600, width * 0.25]);

var root = d3.hierarchy(treeData);
root.x0 = height * 0.305;
root.y0 = 40;

collapse(root);
update(root);

// 计算当前最深层级
function calculateMaxDepth(node) {
    if (!node.children) return 0;
    
    let maxChildDepth = 0;
    node.children.forEach(child => {
        const childDepth = calculateMaxDepth(child);
        maxChildDepth = Math.max(maxChildDepth, childDepth);
    });
    
    return maxChildDepth + 1;
}

// 计算每层节点数
function calculateNodesPerLevel(node) {
    // 重置计数器
    depthNodeCounts = {};
    maxNodesPerLevel = 0;
    
    // 使用BFS遍历计算每层节点数
    const queue = [{node: node, depth: 0}];
    
    while (queue.length > 0) {
        const {node: currentNode, depth} = queue.shift();
        
        // 更新当前深度的节点计数
        depthNodeCounts[depth] = (depthNodeCounts[depth] || 0) + 1;
        maxNodesPerLevel = Math.max(maxNodesPerLevel, depthNodeCounts[depth]);
        
        // 将子节点加入队列
        if (currentNode.children) {
            currentNode.children.forEach(child => {
                queue.push({node: child, depth: depth + 1});
            });
        }
    }
    
    return {depthNodeCounts, maxNodesPerLevel};
}

// 更新树的布局尺寸
function updateTreeSize() {
    const baseWidth = 0.25;
    const widthIncrement = 0.06;
    const newWidth = baseWidth + (currentMaxDepth * widthIncrement);
    
    // 计算高度调整值
    const deltaHeight = Math.max(0, maxNodesPerLevel - 4) * 160;
    const baseHeight = 600;
    const newHeight = baseHeight + deltaHeight;
    
    treeLayout.size([newHeight, width * newWidth]);
}

var i = 0;
function update(source) {
    // 计算当前展开节点的最深层级
    currentMaxDepth = calculateMaxDepth(root);
    
    // 计算每层节点数
    const {depthNodeCounts: counts, maxNodesPerLevel: maxNodes} = calculateNodesPerLevel(root);
    maxNodesPerLevel = maxNodes;
    
    // 更新树的布局尺寸
    updateTreeSize();
    
    // 使用更新后的树布局
    var treeData0 = treeLayout(root);

    var nodes = treeData0.descendants(),
        links = treeData0.links();

    // **************** Nodes ****************
    var node = g.selectAll('.node')
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        });

    // 单击和双击处理
    nodeEnter.on('click', clickHandler)
             .on('dblclick', dblclickHandler);

    function clickHandler(event, d) {
        event.stopPropagation();
        var that = this;
        clearTimeout(d.clickTimeout);
        d.clickTimeout = setTimeout(function() {
            click(event, d);
        }, 180);
    }

    function dblclickHandler(event, d) {
        event.stopPropagation();
        clearTimeout(d.clickTimeout);
        console.log("Id:",d.data.index,nodeList[d.data.index]);
        dblclick(event, d);
    }

    // 绘制九宫格矩形
    nodeEnter.append('rect')
        .attr('x', -25)
        .attr('y', -25)
        .attr('width', 50)
        .attr('height', 50)

    // 绘制九宫格
    nodeEnter.each(function(d) {
        if (!nodeList[d.data.index].ifOpt && nodeList[d.data.index].children.length !== 0) { 
            recttype = 'rect-type0';
            linetype = 'line-type0';
        }
        else if (nodeList[d.data.index].ifOpt && nodeList[d.data.index].children.length !== 0) {
            recttype = 'rect-type1';
            linetype = 'line-type1';
        }
        else if (!nodeList[d.data.index].ifOpt && nodeList[d.data.index].children.length === 0) {
            recttype = 'rect-type2';
            linetype = 'line-type2';
        }
        else {
            recttype = 'rect-type3';
            linetype = 'line-type3';
        }
        d3.select(this).select('rect').attr('class', recttype);
        var gridSize = 50 / 3;
        var numbers = nodeList[d.data.index].stateValue;
        var gridGroup = d3.select(this).append('g')
            .attr('class', 'grid');

        // 绘制网格线
        for (var i = 1; i < 3; i++) {
            gridGroup.append('line')
                .attr('x1', -25 + i * gridSize)
                .attr('y1', -25)
                .attr('x2', -25 + i * gridSize)
                .attr('y2', 25)
                .attr('class', linetype);

            gridGroup.append('line')
                .attr('x1', -25)
                .attr('y1', -25 + i * gridSize)
                .attr('x2', 25)
                .attr('y2', -25 + i * gridSize)
                .attr('class', linetype);
        }

        // 填充数字
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 3; col++) {
                var num = numbers[row * 3 + col];
                gridGroup.append('text')
                    .attr('x', -25 + col * gridSize + gridSize / 2)
                    .attr('y', -25 + row * gridSize + gridSize / 2 + 4)
                    .attr('text-anchor', 'middle')
                    .text(num);
            }
        }
    });

    var nodeUpdate = nodeEnter.merge(node);

    nodes.filter(d => d.depth === 0).forEach(d => d.y += 40);

    nodeUpdate.transition()
        .duration(300)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    var nodeExit = node.exit().transition()
        .duration(300)
        .attr("transform", function(d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // **************** Links ****************
    var link = g.selectAll('.link')
        .data(links, function(d) { return d.target.id; });

    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d) {
            var o = { x: source.x0, y: source.y0 };
            return diagonal(o, o);
        });

    var linkUpdate = linkEnter.merge(link);

    linkUpdate.transition()
        .duration(300)
        .attr('d', function(d) {
            return diagonal(d.source, d.target);
        });

    var linkExit = link.exit().transition()
        .duration(300)
        .attr('d', function(d) {
            var o = { x: source.x, y: source.y };
            return diagonal(o, o);
        })
        .remove();

    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function diagonal(s, d) {
    var path = `M ${s.y} ${s.x}
                C ${(s.y + d.y) / 2} ${s.x},
                  ${(s.y + d.y) / 2} ${d.x},
                  ${d.y} ${d.x}`;
    return path;
}

function click(event, d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}

function dblclick(event, d) {
    if(!optimalPathCheckbox.checked) {
        restoreNodeStyle(currentStateIndex);
        currentStateIndex = d.data.index;
        currentStateElement.textContent = currentStateIndex;
        renderGrid('currentState', nodeList[currentStateIndex].stateValue);
        changeNodeStyle(currentStateIndex);
        renderCloseTable(currentStateIndex);
        renderOpenTable(currentStateIndex);
    }
    else if(optimalPathCheckbox.checked && optList.includes(d.data.index)) {
        restoreNodeStyle(optList[optCurrentStateIndex]);
        optCurrentStateIndex = optList.indexOf(d.data.index);
        currentStateElement.textContent = optCurrentStateIndex;
        renderGrid('currentState', nodeList[optList[optCurrentStateIndex]].stateValue);
        changeNodeStyle(optList[optCurrentStateIndex]);
        renderCloseTable(optList[optCurrentStateIndex]);
        renderOpenTable(optList[optCurrentStateIndex]);
    }
    update(d);
}

// 收缩节点
function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

// 展开最优路径上的节点，收缩其他节点
function expandOptimalPath(node) {
    if (nodeList[node.data.index].ifOpt) {
        // 如果节点在最优路径上，确保其子节点展开
        if (node._children) {
            node.children = node._children;
            node._children = null;
        }
        if (node.children) {
            node.children.forEach(expandOptimalPath);
        }
    } else {
        // 如果节点不在最优路径上，收缩其子节点
        if (node.children) {
            node._children = node.children;
            node._children.forEach(expandOptimalPath);
            node.children = null;
        }
    }
}

// 展开到指定节点的功能，但不展开该节点本身
function expandToNode(nodeId) {
    let path = [];
    let expandingNode = null;

    // 在树中查找指定节点的父节点，并获取路径
    function findNode(node) {
        if ((node.children && node.children.some(child => child.data.index === nodeId)) ||
            (node._children && node._children.some(child => child.data.index === nodeId))) {
            // 找到指定节点的父节点
            path.push(node);
            expandingNode = node; // 将要展开的节点
            return true;
        } else if (node.children || node._children) {
            let children = node.children ? node.children : node._children;
            for (let child of children) {
                if (findNode(child)) {
                    path.push(node);
                    return true;
                }
            }
        }
        return false;
    }

    if (findNode(root)) {
        // 展开路径上的所有节点（不包括指定的节点）
        path.reverse().forEach(node => {
            if (node._children) {
                node.children = node._children;
                node._children = null;
                update(node);
            }
        });    
    } else {
        console.warn(`Node with ID ${nodeId} not found in the tree.`);
    }
}

// 更改节点样式
function changeNodeStyle(nodeId) {
    // 选择具有指定节点ID的节点
    g.selectAll('.node')
    .filter(function(d) { return d.data.index === nodeId; })
    .each(function(d) {
        // 更改矩形的类名
        d3.select(this).select('rect').attr('class', 'rect-type4');
        // 更改网格线的类名
        d3.select(this).selectAll('line').attr('class', 'line-type4');
    });
}

// 恢复节点样式
function restoreNodeStyle(nodeId) {
    // 根据nodeId确定原来的rect和line的类名
    let recttype, linetype;
    if (!nodeList[nodeId].ifOpt && nodeList[nodeId].children.length !== 0) { 
        recttype = 'rect-type0';
        linetype = 'line-type0';
    }
    else if (nodeList[nodeId].ifOpt && nodeList[nodeId].children.length !== 0) {
        recttype = 'rect-type1';
        linetype = 'line-type1';
    }
    else if (!nodeList[nodeId].ifOpt && nodeList[nodeId].children.length === 0) {
        recttype = 'rect-type2';
        linetype = 'line-type2';
    }
    else {
        recttype = 'rect-type3';
        linetype = 'line-type3';
    }
    // 选择具有指定节点ID的节点
    g.selectAll('.node')
    .filter(function(d) { return d.data.index === nodeId; })
    .each(function(d) {
        // 恢复矩形的类名
        d3.select(this).select('rect').attr('class', recttype);
        // 恢复网格线的类名
        d3.select(this).selectAll('line').attr('class', linetype);
    });
}


// 实时状态显示区域

// 绘制实时状态区域的九宫格
function renderGrid(containerId, data) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    data.forEach(num => {
        const cell = document.createElement('div');
        cell.textContent = num === 0 ? '' : num;
        container.appendChild(cell);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderGrid('targetState', targetStateData);
});

const currentStateElement = document.getElementById('currentStateId');
const totalStatesElement = document.getElementById('totalStates');
const minStepsElement = document.getElementById('minSteps');

let currentStateIndex = 0;
let optCurrentStateIndex = 0;
currentStateElement.textContent = currentStateIndex;
totalStatesElement.textContent = totalTreeNodeCount;
minStepsElement.textContent = minSteps

// 获取 checkbox 元素
const optimalPathCheckbox = document.getElementById('optimalPath');
const notShowListCheckbox = document.getElementById('notShowList');

// 添加事件监听器
optimalPathCheckbox.addEventListener('change', toggleOptimalPath);
notShowListCheckbox.addEventListener('change', toggleNotShowList);

// 定义 toggleOptimalPath 函数,在 checkbox 状态改变时被调用
function toggleOptimalPath() {
    if (optimalPathCheckbox.checked) {
        expandOptimalPath(root);
        restoreNodeStyle(currentStateIndex);
        update(root);
        totalStatesElement.textContent = minSteps;
        currentStateElement.textContent = optCurrentStateIndex
        changeNodeStyle(optList[optCurrentStateIndex]);
        renderGrid('currentState', nodeList[optList[optCurrentStateIndex]].stateValue);
        renderOpenTable(optList[optCurrentStateIndex]);
        renderCloseTable(optList[optCurrentStateIndex]);
    } else {
        restoreNodeStyle(optList[optCurrentStateIndex]);
        totalStatesElement.textContent = totalTreeNodeCount;
        currentStateElement.textContent = currentStateIndex;
        expandToNode(currentStateIndex);
        changeNodeStyle(currentStateIndex);
        renderGrid('currentState', nodeList[currentStateIndex].stateValue);
        renderOpenTable(currentStateIndex);
        renderCloseTable(currentStateIndex);
    }
}

function toggleNotShowList() {
    if (notShowListCheckbox.checked) {
        const openTable = document.getElementById('openTable');
        const closeTable = document.getElementById('closeTable');
        openTable.innerHTML = '';
        closeTable.innerHTML = '';
    } else {
        renderOpenTable(currentStateIndex);
        renderCloseTable(currentStateIndex);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderGrid('currentState', nodeList[currentStateIndex].stateValue);
});

const randomizeButton = document.getElementById('randomize');
const nextStepButton = document.getElementById('nextStep');
const resetButton = document.getElementById('reset');

randomizeButton.addEventListener('click', handleRandomize);
nextStepButton.addEventListener('click', handleNextStep);
resetButton.addEventListener('click', handleReset);

function handleRandomize() {
    location.reload();
}

function handleNextStep() {
    if (optimalPathCheckbox.checked && optCurrentStateIndex < minSteps) {
        restoreNodeStyle(optList[optCurrentStateIndex]);
        optCurrentStateIndex++;
        currentStateElement.textContent = optCurrentStateIndex;
        renderGrid('currentState', nodeList[optList[optCurrentStateIndex]].stateValue);
        renderOpenTable(optList[optCurrentStateIndex]);
        renderCloseTable(optList[optCurrentStateIndex]);
        expandToNode(optList[optCurrentStateIndex]);
        changeNodeStyle(optList[optCurrentStateIndex]);
    }
    else if (!optimalPathCheckbox.checked && currentStateIndex < totalTreeNodeCount) {
        restoreNodeStyle(currentStateIndex);
        currentStateIndex++;
        currentStateElement.textContent = currentStateIndex;
        renderGrid('currentState', nodeList[currentStateIndex].stateValue);
        renderOpenTable(currentStateIndex);
        renderCloseTable(currentStateIndex);
        expandToNode(currentStateIndex);
        changeNodeStyle(currentStateIndex);
    }
}

function handleReset() {
    restoreNodeStyle(currentStateIndex);
    restoreNodeStyle(optList[optCurrentStateIndex]);
    currentStateIndex = 0;
    optCurrentStateIndex = 0;
    currentStateElement.textContent = currentStateIndex;
    renderGrid('currentState', nodeList[currentStateIndex].stateValue);
    renderOpenTable(currentStateIndex);
    renderCloseTable(currentStateIndex);
    collapse(root);
    update(root);
}

// 表区域
// 创建表格项
function createTableEntry(item) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'table-entry';

    const idDiv = document.createElement('div');
    idDiv.className = 'state-id';
    idDiv.textContent = 'ID: ' + item;

    const matrixDiv = document.createElement('div');
    matrixDiv.className = 'matrix33';

    nodeList[item].stateValue.forEach(value => {
        const cell = document.createElement('div');
        cell.textContent = value !== 0 ? value : '';
        matrixDiv.appendChild(cell);
    });
    entryDiv.appendChild(idDiv);
    entryDiv.appendChild(matrixDiv);
    return entryDiv;
}

// 渲染Open表
function renderOpenTable(index) {
    if (notShowListCheckbox.checked) {
        return;
    }

    const openTable = document.getElementById('openTable');
    openTable.innerHTML = ''
    nodeList[index].openList.forEach(item => {
        const entry = createTableEntry(item);
        openTable.appendChild(entry);
    });
}

// 渲染Close表
function renderCloseTable(index) {
    if (notShowListCheckbox.checked) {
        return;
    }

    const closeTable = document.getElementById('closeTable');
    closeTable.innerHTML = ''
    nodeList[index].closeList.forEach(item => {
        const entry = createTableEntry(item);
        closeTable.appendChild(entry);
    });
}