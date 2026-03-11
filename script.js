document.addEventListener('DOMContentLoaded', () => {
    const algorithmSelect = document.getElementById('algorithm');
    const dataTypeSelect = document.getElementById('data-type');
    const sizeInput = document.getElementById('size');
    const speedInput = document.getElementById('speed');
    const speedLabel = document.getElementById('speed-label');
    const customArrayInput = document.getElementById('custom-array');
    const inputStatus = document.getElementById('input-status');

    const generateDataButton = document.getElementById('generate-data');
    const useCustomDataButton = document.getElementById('use-custom-data');
    const startSortButton = document.getElementById('start-sort');
    const saveResultsButton = document.getElementById('save-results');

    const sortingCanvasElement = document.getElementById('sorting-canvas');
    const heapCanvasElement = document.getElementById('heap-canvas');
    const timeChartElement = document.getElementById('time-chart');
    const visualizationGrid = document.getElementById('visualization-grid');
    const heapTreePanel = document.getElementById('heap-tree-panel');
    const auxVisualTitle = document.getElementById('aux-visual-title');
    const numbersContainer = document.getElementById('numbers-container');

    if (
        !algorithmSelect || !dataTypeSelect || !sizeInput || !speedInput || !speedLabel ||
        !customArrayInput || !inputStatus || !generateDataButton || !useCustomDataButton ||
        !startSortButton || !saveResultsButton || !sortingCanvasElement || !heapCanvasElement ||
        !timeChartElement || !visualizationGrid || !heapTreePanel || !auxVisualTitle || !numbersContainer
    ) {
        console.error('Required DOM elements are missing.');
        return;
    }

    const sortingCtx = sortingCanvasElement.getContext('2d');
    const heapCtx = heapCanvasElement.getContext('2d');
    const timeChartCtx = timeChartElement.getContext('2d');

    if (!sortingCtx || !heapCtx || !timeChartCtx) {
        console.error('Could not initialize one or more canvas contexts.');
        return;
    }

    const datasetOrder = ['quicksort', 'mergesort', 'heapsort', 'selectionsort'];
    const datasetColors = {
        quicksort: '#e74c3c',
        mergesort: '#3498db',
        heapsort: '#2ecc71',
        selectionsort: '#f1c40f'
    };

    const results = [];
    let data = [];
    let isSorting = false;

    const mergeTreeState = {
        nodes: [],
        nodeMap: new Map(),
        activeNodeId: null,
        activeRange: null,
        phase: 'idle',
        description: 'Run MergeSort to see recursive split and merge.'
    };

    const timeChart = new Chart(timeChartCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'QuickSort', data: [], borderColor: datasetColors.quicksort, fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2 },
                { label: 'MergeSort', data: [], borderColor: datasetColors.mergesort, fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2 },
                { label: 'HeapSort', data: [], borderColor: datasetColors.heapsort, fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2 },
                { label: 'SelectionSort', data: [], borderColor: datasetColors.selectionsort, fill: false, tension: 0.35, pointRadius: 4, borderWidth: 2 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Time (seconds)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Array Size'
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Sorting Algorithm Performance'
                }
            }
        }
    });

    function setStatus(message, type = 'neutral') {
        inputStatus.textContent = message;
        inputStatus.className = 'status';
        if (type === 'error') inputStatus.classList.add('error');
        if (type === 'success') inputStatus.classList.add('success');
    }

    function getDelayMs() {
        const speed = Number(speedInput.value);
        return Math.max(4, 230 - speed * 2.2);
    }

    function updateSpeedLabel() {
        speedLabel.textContent = `Speed: ${speedInput.value}`;
    }

    function formatNumber(value) {
        if (Number.isInteger(value)) return value.toString();
        return value.toFixed(2).replace(/\.00$/, '').replace(/(\.[0-9])0$/, '$1');
    }

    function generateRandomData(size, type) {
        const array = [];
        for (let i = 0; i < size; i += 1) {
            if (type === 'int') {
                array.push(Math.floor(Math.random() * 400) + 1);
            } else if (type === 'float') {
                array.push(Number((Math.random() * 400 + 1).toFixed(2)));
            } else {
                array.push(Math.floor(Math.random() * 801) - 400);
            }
        }
        return array;
    }

    function parseCustomArray(rawInput) {
        const tokens = rawInput
            .trim()
            .split(/[\s,;]+/)
            .filter(Boolean);

        if (tokens.length === 0) {
            throw new Error('Please enter at least one number.');
        }

        const parsed = tokens.map((token) => {
            const value = Number(token);
            if (Number.isNaN(value)) {
                throw new Error(`"${token}" is not a valid number.`);
            }
            return value;
        });

        if (parsed.length > 500) {
            throw new Error('For visualization, keep custom arrays at 500 values or less.');
        }

        return parsed;
    }

    function renderNumbers(array, highlights = {}) {
        numbersContainer.innerHTML = '';

        const maxShown = 180;
        const shownArray = array.slice(0, maxShown);

        shownArray.forEach((value, index) => {
            const chip = document.createElement('span');
            chip.className = 'num-chip';
            chip.textContent = formatNumber(value);
            if (highlights[index]) {
                chip.style.background = highlights[index];
                chip.style.color = '#ffffff';
                chip.style.borderColor = highlights[index];
            }
            numbersContainer.appendChild(chip);
        });

        if (array.length > maxShown) {
            const more = document.createElement('span');
            more.className = 'num-chip';
            more.textContent = `... +${array.length - maxShown} more`;
            numbersContainer.appendChild(more);
        }
    }

    function drawData(array, highlights = {}, sortedFrom = array.length, sortedPrefix = -1, quickState = null) {
        const { width, height } = sortingCanvasElement;
        sortingCtx.clearRect(0, 0, width, height);

        if (!array.length) {
            renderNumbers(array, highlights);
            return;
        }

        const lowerBound = Math.min(0, ...array);
        const upperBound = Math.max(0, ...array);
        const range = upperBound - lowerBound || 1;
        const zeroY = height - ((0 - lowerBound) / range) * height;

        sortingCtx.strokeStyle = '#d8e1ec';
        sortingCtx.lineWidth = 1;
        sortingCtx.beginPath();
        sortingCtx.moveTo(0, zeroY);
        sortingCtx.lineTo(width, zeroY);
        sortingCtx.stroke();

        const barWidth = width / array.length;
        const maxVisibleLabels = 90;
        const labelStride = array.length > maxVisibleLabels
            ? Math.ceil(array.length / maxVisibleLabels)
            : 1;
        const labelFontSize = Math.max(9, Math.min(13, Math.floor(barWidth * 0.52)));

        sortingCtx.font = `${labelFontSize}px Roboto`;
        sortingCtx.textAlign = 'center';
        sortingCtx.textBaseline = 'middle';

        const pivotIndex = quickState && Number.isInteger(quickState.pivotIndex)
            ? quickState.pivotIndex
            : null;
        let pivotMarker = null;

        for (let index = 0; index < array.length; index += 1) {
            const value = array[index];
            const valueY = height - ((value - lowerBound) / range) * height;
            const y = Math.min(valueY, zeroY);
            const barHeight = Math.max(1, Math.abs(zeroY - valueY));
            const x = index * barWidth;

            let color = '#4da3ff';
            if (index >= sortedFrom || (sortedPrefix >= 0 && index <= sortedPrefix)) {
                color = '#2ecc71';
            }
            if (highlights[index]) {
                color = highlights[index];
            }

            sortingCtx.fillStyle = color;
            sortingCtx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);

            if (index === pivotIndex) {
                pivotMarker = { x, y, barHeight, value };
            }

            const shouldDrawLabel = index % labelStride === 0 || index === array.length - 1;
            if (!shouldDrawLabel) {
                continue;
            }

            const label = formatNumber(value);
            let textColor = '#ffffff';
            let textY;

            if (barHeight <= labelFontSize + 4) {
                textColor = '#1f2a38';
                textY = value >= 0 ? y - 6 : y + barHeight + 8;
            } else if (value >= 0) {
                textY = y + Math.min(12, barHeight / 2);
            } else {
                textY = y + barHeight - Math.min(12, barHeight / 2);
            }

            textY = Math.min(height - 8, Math.max(10, textY));
            sortingCtx.fillStyle = textColor;
            sortingCtx.fillText(label, x + barWidth / 2, textY);
        }

        if (pivotMarker) {
            const markerWidth = Math.max(2, barWidth - 2);
            const pivotLabelY = Math.max(12, pivotMarker.y - 10);

            sortingCtx.strokeStyle = '#ff006e';
            sortingCtx.lineWidth = 2;
            sortingCtx.strokeRect(
                pivotMarker.x + 1,
                Math.max(0, pivotMarker.y - 1),
                markerWidth,
                Math.min(height - pivotMarker.y + 2, pivotMarker.barHeight + 2)
            );

            sortingCtx.fillStyle = '#ff006e';
            sortingCtx.font = 'bold 12px Roboto';
            sortingCtx.textAlign = 'center';
            sortingCtx.textBaseline = 'middle';
            sortingCtx.fillText(`P: ${formatNumber(pivotMarker.value)}`, pivotMarker.x + barWidth / 2, pivotLabelY);
        }

        renderNumbers(array, highlights);
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function computeHeapNodePosition(index, heapSize, width, topPadding, levelGap) {
        const level = Math.floor(Math.log2(index + 1));
        const firstIndexInLevel = Math.pow(2, level) - 1;
        const positionInLevel = index - firstIndexInLevel;
        const levelNodeCount = Math.pow(2, level);

        const x = ((positionInLevel + 1) * width) / (levelNodeCount + 1);
        const y = topPadding + level * levelGap;

        return { x, y };
    }

    function drawHeapTree(array, heapSize, highlights = {}) {
        const { width, height } = heapCanvasElement;
        heapCtx.clearRect(0, 0, width, height);

        if (!array.length || heapSize <= 0) {
            return;
        }

        const levels = Math.floor(Math.log2(heapSize)) + 1;
        const topPadding = 36;
        const bottomPadding = 44;
        const levelGap = levels <= 1 ? 0 : (height - topPadding - bottomPadding) / (levels - 1);
        const nodeRadius = Math.max(11, Math.min(20, 26 - levels));

        const positions = Array.from({ length: heapSize }, (_, index) => (
            computeHeapNodePosition(index, heapSize, width, topPadding, levelGap)
        ));

        heapCtx.strokeStyle = '#b4c7dc';
        heapCtx.lineWidth = 1.5;
        for (let i = 0; i < heapSize; i += 1) {
            const left = 2 * i + 1;
            const right = 2 * i + 2;

            if (left < heapSize) {
                heapCtx.beginPath();
                heapCtx.moveTo(positions[i].x, positions[i].y);
                heapCtx.lineTo(positions[left].x, positions[left].y);
                heapCtx.stroke();
            }

            if (right < heapSize) {
                heapCtx.beginPath();
                heapCtx.moveTo(positions[i].x, positions[i].y);
                heapCtx.lineTo(positions[right].x, positions[right].y);
                heapCtx.stroke();
            }
        }

        for (let i = 0; i < heapSize; i += 1) {
            const { x, y } = positions[i];
            const fill = highlights[i] || '#4da3ff';

            heapCtx.beginPath();
            heapCtx.arc(x, y, nodeRadius, 0, Math.PI * 2);
            heapCtx.fillStyle = fill;
            heapCtx.fill();
            heapCtx.strokeStyle = '#2f4f6a';
            heapCtx.lineWidth = 1;
            heapCtx.stroke();

            heapCtx.fillStyle = '#ffffff';
            heapCtx.font = `${Math.max(9, nodeRadius * 0.75)}px Roboto`;
            heapCtx.textAlign = 'center';
            heapCtx.textBaseline = 'middle';
            const label = formatNumber(array[i]);
            const clippedLabel = label.length > 6 ? `${label.slice(0, 5)}~` : label;
            heapCtx.fillText(clippedLabel, x, y);
        }
    }
    function resetMergeTreeState(message = 'Run MergeSort to see recursive split and merge.') {
        mergeTreeState.nodes.length = 0;
        mergeTreeState.nodeMap.clear();
        mergeTreeState.activeNodeId = null;
        mergeTreeState.activeRange = null;
        mergeTreeState.phase = 'idle';
        mergeTreeState.description = message;
    }

    function mergeRangeKey(left, right) {
        return `${left}:${right}`;
    }

    function ensureMergeNode(left, right, depth, parentId = null) {
        const key = mergeRangeKey(left, right);
        let node = mergeTreeState.nodeMap.get(key);

        if (!node) {
            node = {
                id: key,
                left,
                right,
                depth,
                parentId,
                status: 'pending'
            };
            mergeTreeState.nodeMap.set(key, node);
            mergeTreeState.nodes.push(node);
        } else {
            if (node.parentId === null && parentId !== null) {
                node.parentId = parentId;
            }
            node.depth = Math.min(node.depth, depth);
        }

        return node;
    }

    function drawMergeTree(state = mergeTreeState) {
        const { width, height } = heapCanvasElement;
        heapCtx.clearRect(0, 0, width, height);

        heapCtx.fillStyle = '#253447';
        heapCtx.font = 'bold 15px Roboto';
        heapCtx.textAlign = 'left';
        heapCtx.textBaseline = 'middle';
        heapCtx.fillText('MergeSort Divide & Merge Tree', 14, 22);

        heapCtx.fillStyle = '#617489';
        heapCtx.font = '12px Roboto';
        heapCtx.fillText(state.description, 14, 42);

        if (state.activeRange) {
            heapCtx.fillText(`Active range: [${state.activeRange.left}..${state.activeRange.right}]`, 14, 58);
        }

        if (!state.nodes.length) {
            heapCtx.fillStyle = '#8a9bad';
            heapCtx.font = '13px Roboto';
            heapCtx.fillText('Press Start Sorting with MergeSort to animate split and merge steps.', 14, 84);
            return;
        }

        const nodesByDepth = new Map();
        let maxDepth = 0;

        state.nodes.forEach((node) => {
            maxDepth = Math.max(maxDepth, node.depth);
            if (!nodesByDepth.has(node.depth)) {
                nodesByDepth.set(node.depth, []);
            }
            nodesByDepth.get(node.depth).push(node);
        });

        for (let depth = 0; depth <= maxDepth; depth += 1) {
            const levelNodes = nodesByDepth.get(depth) || [];
            levelNodes.sort((a, b) => a.left - b.left || a.right - b.right);
        }

        const topPadding = 92;
        const bottomPadding = 22;
        const levelGap = maxDepth === 0 ? 0 : (height - topPadding - bottomPadding) / maxDepth;

        const positionMap = new Map();
        let maxNodesAtDepth = 1;

        for (let depth = 0; depth <= maxDepth; depth += 1) {
            const levelNodes = nodesByDepth.get(depth) || [];
            maxNodesAtDepth = Math.max(maxNodesAtDepth, levelNodes.length);
            for (let idx = 0; idx < levelNodes.length; idx += 1) {
                const node = levelNodes[idx];
                const x = ((idx + 1) * width) / (levelNodes.length + 1);
                const y = topPadding + depth * levelGap;
                positionMap.set(node.id, { x, y });
            }
        }

        heapCtx.strokeStyle = '#bfd0e5';
        heapCtx.lineWidth = 1.3;

        state.nodes.forEach((node) => {
            if (!node.parentId) return;
            const childPos = positionMap.get(node.id);
            const parentPos = positionMap.get(node.parentId);
            if (!childPos || !parentPos) return;

            heapCtx.beginPath();
            heapCtx.moveTo(parentPos.x, parentPos.y + 13);
            heapCtx.lineTo(childPos.x, childPos.y - 13);
            heapCtx.stroke();
        });

        const rectWidth = Math.max(52, Math.min(136, (width / (maxNodesAtDepth + 0.4)) * 0.84));
        const rectHeight = 28;

        const statusColor = {
            pending: '#dce9f9',
            split: '#5dade2',
            base: '#f5b041',
            merged: '#2ecc71'
        };

        const orderedNodes = [...state.nodes].sort((a, b) => a.depth - b.depth || a.left - b.left);

        orderedNodes.forEach((node) => {
            const pos = positionMap.get(node.id);
            if (!pos) return;

            let fill = statusColor[node.status] || statusColor.pending;
            let textColor = '#23374d';

            if (node.id === state.activeNodeId) {
                fill = '#e74c3c';
                textColor = '#ffffff';
            }

            const x = pos.x - rectWidth / 2;
            const y = pos.y - rectHeight / 2;
            drawRoundedRect(heapCtx, x, y, rectWidth, rectHeight, 7);
            heapCtx.fillStyle = fill;
            heapCtx.fill();
            heapCtx.strokeStyle = '#2f4f6a';
            heapCtx.lineWidth = 1;
            heapCtx.stroke();

            let label;
            if (node.left === node.right) {
                label = `[${node.left}]`;
            } else {
                label = `[${node.left}..${node.right}]`;
            }

            if (label.length > 12) {
                label = `${label.slice(0, 11)}~`;
            }

            heapCtx.fillStyle = textColor;
            heapCtx.font = '11px Roboto';
            heapCtx.textAlign = 'center';
            heapCtx.textBaseline = 'middle';
            heapCtx.fillText(label, pos.x, pos.y);
        });
    }

    function getAuxMode(algorithm = algorithmSelect.value) {
        if (algorithm === 'heapsort') return 'heap';
        if (algorithm === 'mergesort') return 'merge';
        return null;
    }

    function updateAuxPanelVisibility(mode = undefined) {
        const resolvedMode = mode === undefined ? getAuxMode() : mode;
        const visible = resolvedMode === 'heap' || resolvedMode === 'merge';

        heapTreePanel.classList.toggle('hidden', !visible);
        visualizationGrid.classList.toggle('with-heap', visible);

        if (!visible) {
            auxVisualTitle.textContent = 'Algorithm View';
            heapCtx.clearRect(0, 0, heapCanvasElement.width, heapCanvasElement.height);
            return null;
        }

        if (resolvedMode === 'heap') {
            auxVisualTitle.textContent = 'Heap Tree (Live Heap Structure)';
        } else if (resolvedMode === 'merge') {
            auxVisualTitle.textContent = 'MergeSort Split / Merge View';
        }

        return resolvedMode;
    }

    function pause(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    async function renderStep(array, state = {}) {
        const bars = state.bars || {};
        const tree = state.tree || bars;
        const quick = state.quick || null;
        const sortedFrom = state.sortedFrom ?? array.length;
        const sortedPrefix = state.sortedPrefix ?? -1;
        const heapSize = state.heapSize ?? array.length;

        drawData(array, bars, sortedFrom, sortedPrefix, quick);

        const modeFromState = Object.prototype.hasOwnProperty.call(state, 'auxMode') ? state.auxMode : undefined;
        const activeMode = updateAuxPanelVisibility(modeFromState);

        if (activeMode === 'heap') {
            drawHeapTree(array, heapSize, tree);
        } else if (activeMode === 'merge') {
            drawMergeTree(state.mergeState || mergeTreeState);
        }

        await pause(getDelayMs());
    }

    function setControlsDisabled(disabled) {
        generateDataButton.disabled = disabled;
        useCustomDataButton.disabled = disabled;
        startSortButton.disabled = disabled;
        algorithmSelect.disabled = disabled;
        sizeInput.disabled = disabled;
        dataTypeSelect.disabled = disabled;
        speedInput.disabled = disabled;
        customArrayInput.disabled = disabled;
    }

    function updateTimeChart(algorithm, size, elapsedSeconds) {
        const sizeLabel = String(size);
        let labelIndex = timeChart.data.labels.indexOf(sizeLabel);

        if (labelIndex === -1) {
            timeChart.data.labels.push(sizeLabel);
            labelIndex = timeChart.data.labels.length - 1;
            timeChart.data.datasets.forEach((dataset) => {
                while (dataset.data.length < timeChart.data.labels.length) {
                    dataset.data.push(null);
                }
            });
        }

        const datasetIndex = datasetOrder.indexOf(algorithm);
        if (datasetIndex === -1) return;

        timeChart.data.datasets[datasetIndex].data[labelIndex] = elapsedSeconds;
        timeChart.update();
    }
    async function quickSort(arr, low, high) {
        if (low < high) {
            const pivotIndex = await partition(arr, low, high);
            await quickSort(arr, low, pivotIndex - 1);
            await quickSort(arr, pivotIndex + 1, high);
        }
    }

    async function partition(arr, low, high) {
        const pivot = arr[high];
        let i = low - 1;

        await renderStep(arr, {
            bars: { [high]: '#f39c12' },
            quick: { pivotIndex: high }
        });

        for (let j = low; j < high; j += 1) {
            if (arr[j] <= pivot) {
                i += 1;
                [arr[i], arr[j]] = [arr[j], arr[i]];
                await renderStep(arr, {
                    bars: { [i]: '#e74c3c', [j]: '#2980b9', [high]: '#f39c12' },
                    quick: { pivotIndex: high }
                });
            }
        }

        [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
        await renderStep(arr, {
            bars: { [i + 1]: '#27ae60', [high]: '#f39c12' },
            quick: { pivotIndex: i + 1 }
        });

        return i + 1;
    }

    async function mergeSort(arr, left, right, depth = 0, parentId = null) {
        const currentNode = ensureMergeNode(left, right, depth, parentId);
        mergeTreeState.activeNodeId = currentNode.id;
        mergeTreeState.activeRange = { left, right };

        if (left >= right) {
            currentNode.status = 'base';
            mergeTreeState.phase = 'divide';
            mergeTreeState.description = `Reached base element at index ${left}.`;

            await renderStep(arr, {
                bars: { [left]: '#f5b041' },
                auxMode: 'merge',
                mergeState: mergeTreeState
            });
            return;
        }

        const mid = Math.floor((left + right) / 2);
        currentNode.status = 'split';
        mergeTreeState.phase = 'divide';
        mergeTreeState.description = `Split [${left}..${right}] into [${left}..${mid}] and [${mid + 1}..${right}].`;

        await renderStep(arr, {
            bars: { [left]: '#3498db', [mid]: '#8e44ad', [right]: '#3498db' },
            auxMode: 'merge',
            mergeState: mergeTreeState
        });

        await mergeSort(arr, left, mid, depth + 1, currentNode.id);
        await mergeSort(arr, mid + 1, right, depth + 1, currentNode.id);
        await merge(arr, left, mid, right, currentNode.id);

        currentNode.status = 'merged';
        mergeTreeState.phase = 'merge';
        mergeTreeState.activeNodeId = currentNode.id;
        mergeTreeState.activeRange = { left, right };
        mergeTreeState.description = `Merged [${left}..${mid}] and [${mid + 1}..${right}] into [${left}..${right}].`;

        await renderStep(arr, {
            bars: { [left]: '#2ecc71', [right]: '#2ecc71' },
            auxMode: 'merge',
            mergeState: mergeTreeState
        });
    }

    async function merge(arr, left, mid, right, nodeId) {
        const leftPart = arr.slice(left, mid + 1);
        const rightPart = arr.slice(mid + 1, right + 1);

        let i = 0;
        let j = 0;
        let k = left;

        mergeTreeState.phase = 'merge';
        mergeTreeState.activeNodeId = nodeId;
        mergeTreeState.activeRange = { left, right };
        mergeTreeState.description = `Merging [${left}..${mid}] with [${mid + 1}..${right}]...`;

        await renderStep(arr, {
            bars: { [left]: '#e67e22', [right]: '#e67e22' },
            auxMode: 'merge',
            mergeState: mergeTreeState
        });

        while (i < leftPart.length && j < rightPart.length) {
            if (leftPart[i] <= rightPart[j]) {
                arr[k] = leftPart[i];
                i += 1;
            } else {
                arr[k] = rightPart[j];
                j += 1;
            }

            await renderStep(arr, {
                bars: { [k]: '#e67e22' },
                auxMode: 'merge',
                mergeState: mergeTreeState
            });
            k += 1;
        }

        while (i < leftPart.length) {
            arr[k] = leftPart[i];
            i += 1;
            await renderStep(arr, {
                bars: { [k]: '#e67e22' },
                auxMode: 'merge',
                mergeState: mergeTreeState
            });
            k += 1;
        }

        while (j < rightPart.length) {
            arr[k] = rightPart[j];
            j += 1;
            await renderStep(arr, {
                bars: { [k]: '#e67e22' },
                auxMode: 'merge',
                mergeState: mergeTreeState
            });
            k += 1;
        }
    }

    async function heapify(arr, heapSize, root) {
        let largest = root;
        const left = 2 * root + 1;
        const right = 2 * root + 2;

        if (left < heapSize && arr[left] > arr[largest]) {
            largest = left;
        }

        if (right < heapSize && arr[right] > arr[largest]) {
            largest = right;
        }

        if (largest !== root) {
            [arr[root], arr[largest]] = [arr[largest], arr[root]];

            await renderStep(arr, {
                auxMode: 'heap',
                heapSize,
                bars: { [root]: '#e74c3c', [largest]: '#2980b9' },
                tree: { [root]: '#e74c3c', [largest]: '#2980b9' }
            });

            await heapify(arr, heapSize, largest);
        }
    }

    async function heapSort(arr) {
        const n = arr.length;

        for (let i = Math.floor(n / 2) - 1; i >= 0; i -= 1) {
            await heapify(arr, n, i);
            await renderStep(arr, {
                auxMode: 'heap',
                heapSize: n,
                bars: { [i]: '#f39c12' },
                tree: { [i]: '#f39c12' }
            });
        }

        for (let end = n - 1; end > 0; end -= 1) {
            [arr[0], arr[end]] = [arr[end], arr[0]];

            await renderStep(arr, {
                auxMode: 'heap',
                heapSize: end,
                sortedFrom: end,
                bars: { 0: '#e74c3c', [end]: '#27ae60' },
                tree: { 0: '#e74c3c' }
            });

            await heapify(arr, end, 0);
        }

        await renderStep(arr, { auxMode: 'heap', heapSize: n, sortedFrom: 0 });
    }

    async function selectionSort(arr) {
        const n = arr.length;

        for (let i = 0; i < n - 1; i += 1) {
            let minIndex = i;

            for (let j = i + 1; j < n; j += 1) {
                if (arr[j] < arr[minIndex]) {
                    minIndex = j;
                }

                const stride = Math.max(1, Math.floor(n / 24));
                if (j === n - 1 || j % stride === 0) {
                    await renderStep(arr, {
                        bars: { [i]: '#e74c3c', [j]: '#3498db', [minIndex]: '#f39c12' },
                        sortedPrefix: i - 1
                    });
                }
            }

            if (minIndex !== i) {
                [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
            }

            await renderStep(arr, {
                bars: { [i]: '#27ae60', [minIndex]: '#3498db' },
                sortedPrefix: i
            });
        }
    }

    function previewAuxPanelForCurrentAlgorithm() {
        const mode = updateAuxPanelVisibility(getAuxMode());

        if (mode === 'heap' && data.length) {
            drawHeapTree(data, data.length);
        } else if (mode === 'merge') {
            drawMergeTree(mergeTreeState);
        }
    }

    async function visualizeSorting() {
        if (isSorting) return;

        if (!data.length) {
            setStatus('Generate data or use a custom array first.', 'error');
            return;
        }

        const algorithm = algorithmSelect.value;
        const auxMode = getAuxMode(algorithm);
        const working = [...data];

        isSorting = true;
        setControlsDisabled(true);
        setStatus(`Sorting ${working.length} values with ${algorithm}...`);

        updateAuxPanelVisibility(auxMode);

        if (algorithm === 'mergesort') {
            resetMergeTreeState('Starting recursive split phase...');
            drawMergeTree(mergeTreeState);
        }

        const startTime = performance.now();

        try {
            if (algorithm === 'quicksort') {
                await quickSort(working, 0, working.length - 1);
            } else if (algorithm === 'mergesort') {
                await mergeSort(working, 0, working.length - 1, 0, null);
            } else if (algorithm === 'heapsort') {
                await heapSort(working);
            } else if (algorithm === 'selectionsort') {
                await selectionSort(working);
            }

            await renderStep(working, { sortedFrom: 0, auxMode, heapSize: working.length, mergeState: mergeTreeState });

            const elapsedSeconds = Number(((performance.now() - startTime) / 1000).toFixed(4));
            data = working;
            updateTimeChart(algorithm, working.length, elapsedSeconds);
            results.push({
                algorithm,
                size: working.length,
                elapsedSeconds,
                timestamp: new Date().toISOString()
            });

            setStatus(`Done: ${algorithm} sorted ${working.length} values in ${elapsedSeconds}s.`, 'success');
        } catch (error) {
            console.error(error);
            setStatus('Sorting failed. Check console for details.', 'error');
        } finally {
            isSorting = false;
            setControlsDisabled(false);
            previewAuxPanelForCurrentAlgorithm();
        }
    }

    function handleGenerateData() {
        const size = Number(sizeInput.value);
        if (!Number.isInteger(size) || size < 5 || size > 500) {
            setStatus('Array size must be an integer between 5 and 500.', 'error');
            return;
        }

        data = generateRandomData(size, dataTypeSelect.value);
        drawData(data);

        if (algorithmSelect.value === 'mergesort') {
            resetMergeTreeState('Press Start Sorting to watch recursive split and merge.');
        }

        previewAuxPanelForCurrentAlgorithm();
        setStatus(`Generated ${size} ${dataTypeSelect.value} values.`, 'success');
    }

    function handleCustomArray() {
        try {
            const parsed = parseCustomArray(customArrayInput.value);
            data = parsed;
            sizeInput.value = parsed.length;
            drawData(data);

            if (algorithmSelect.value === 'mergesort') {
                resetMergeTreeState('Press Start Sorting to watch recursive split and merge.');
            }

            previewAuxPanelForCurrentAlgorithm();
            setStatus(`Custom array loaded (${parsed.length} values).`, 'success');
        } catch (error) {
            setStatus(error.message, 'error');
        }
    }

    function saveResults() {
        if (!results.length) {
            setStatus('No results to save yet. Run at least one sort first.', 'error');
            return;
        }

        const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `sorting-results-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
        setStatus('Results file downloaded.', 'success');
    }

    speedInput.addEventListener('input', updateSpeedLabel);
    generateDataButton.addEventListener('click', handleGenerateData);
    useCustomDataButton.addEventListener('click', handleCustomArray);
    startSortButton.addEventListener('click', visualizeSorting);
    saveResultsButton.addEventListener('click', saveResults);

    algorithmSelect.addEventListener('change', () => {
        if (algorithmSelect.value === 'mergesort' && mergeTreeState.nodes.length === 0) {
            resetMergeTreeState('Press Start Sorting to watch recursive split and merge.');
        }
        previewAuxPanelForCurrentAlgorithm();
    });

    updateSpeedLabel();
    updateAuxPanelVisibility(getAuxMode());

    data = generateRandomData(Number(sizeInput.value), dataTypeSelect.value);
    drawData(data);
    setStatus('Ready. Generate data or paste your custom array.');
});
