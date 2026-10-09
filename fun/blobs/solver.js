/**
 * Blobs Peg Solitaire solver.
 * Pure, side-effect-free functions. Loaded in browser as window.BlobsSolver;
 * also usable under Node via module.exports for the level-verification script.
 *
 * Cells: 0 = inactive, 1 = empty saucer, 2 = blob.
 * Win = exactly one blob remaining.
 * Moves: jump a neighbor blob (4 cardinal + 4 diagonal) into an empty saucer 2 cells away.
 */
(function (root) {
    'use strict';

    const DIRECTIONS = [
        { dr: -2, dc:  0, mr: -1, mc:  0 },
        { dr:  2, dc:  0, mr:  1, mc:  0 },
        { dr:  0, dc: -2, mr:  0, mc: -1 },
        { dr:  0, dc:  2, mr:  0, mc:  1 },
        { dr: -2, dc: -2, mr: -1, mc: -1 },
        { dr: -2, dc:  2, mr: -1, mc:  1 },
        { dr:  2, dc: -2, mr:  1, mc: -1 },
        { dr:  2, dc:  2, mr:  1, mc:  1 }
    ];

    function allLegalMoves(grid, cols, rows) {
        const moves = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 2) continue;
                for (let i = 0; i < DIRECTIONS.length; i++) {
                    const d = DIRECTIONS[i];
                    const toR = r + d.dr, toC = c + d.dc;
                    const midR = r + d.mr, midC = c + d.mc;
                    if (toR < 0 || toR >= rows || toC < 0 || toC >= cols) continue;
                    if (grid[toR][toC] === 1 && grid[midR][midC] === 2) {
                        moves.push({ fromR: r, fromC: c, toR, toC, midR, midC });
                    }
                }
            }
        }
        return moves;
    }

    function countBlobs(grid, cols, rows) {
        let n = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] === 2) n++;
            }
        }
        return n;
    }

    // Build a (r,c) -> bitIndex map covering only cells with grid[r][c] !== 0.
    // Inactive cells never change so they don't need bits.
    function buildBitIndex(grid, cols, rows) {
        const map = [];
        for (let r = 0; r < rows; r++) map.push(new Array(cols).fill(-1));
        let idx = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] !== 0) { map[r][c] = idx++; }
            }
        }
        return { map, size: idx };
    }

    function encodeState(grid, cols, rows, bitIndex) {
        let bits = 0n;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (grid[r][c] === 2) {
                    bits |= (1n << BigInt(bitIndex.map[r][c]));
                }
            }
        }
        return bits;
    }

    /**
     * Solve from the given grid. Returns { status, moves, nodes, timeMs }.
     *   status: 'solved' | 'unsolvable' | 'timeout'
     *   moves:  array of { fromR, fromC, toR, toC, midR, midC } (empty on unsolvable/timeout)
     */
    function solvePuzzle(initialGrid, cols, rows, opts) {
        const maxNodes = (opts && opts.maxNodes) || 3_000_000;
        const maxMs = (opts && opts.maxMs) || 8000;
        const shuffle = !!(opts && opts.shuffle);
        const rng = (opts && opts.rng) || Math.random;

        const grid = initialGrid.map(row => row.slice());
        const bitIndex = buildBitIndex(grid, cols, rows);
        const seen = new Set();
        const path = [];
        const startTime = Date.now();
        let nodes = 0;
        let timedOut = false;

        function dfs() {
            if (timedOut) return false;
            nodes++;
            if ((nodes & 4095) === 0 && (Date.now() - startTime) > maxMs) {
                timedOut = true;
                return false;
            }
            if (nodes > maxNodes) { timedOut = true; return false; }

            if (countBlobs(grid, cols, rows) === 1) return true;

            const key = encodeState(grid, cols, rows, bitIndex);
            if (seen.has(key)) return false;
            seen.add(key);

            const moves = allLegalMoves(grid, cols, rows);
            if (moves.length === 0) return false;
            if (shuffle) {
                for (let j = moves.length - 1; j > 0; j--) {
                    const k = Math.floor(rng() * (j + 1));
                    const tmp = moves[j]; moves[j] = moves[k]; moves[k] = tmp;
                }
            }

            for (let i = 0; i < moves.length; i++) {
                const m = moves[i];
                grid[m.fromR][m.fromC] = 1;
                grid[m.midR][m.midC] = 1;
                grid[m.toR][m.toC] = 2;
                path.push(m);

                if (dfs()) return true;

                path.pop();
                grid[m.fromR][m.fromC] = 2;
                grid[m.midR][m.midC] = 2;
                grid[m.toR][m.toC] = 1;

                if (timedOut) return false;
            }
            return false;
        }

        const solved = dfs();
        const timeMs = Date.now() - startTime;
        if (solved) return { status: 'solved', moves: path.slice(), nodes, timeMs };
        if (timedOut) return { status: 'timeout', moves: [], nodes, timeMs };
        return { status: 'unsolvable', moves: [], nodes, timeMs };
    }

    const api = { allLegalMoves, countBlobs, solvePuzzle, DIRECTIONS };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.BlobsSolver = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
