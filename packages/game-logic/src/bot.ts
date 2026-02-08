import { BoardState, Move } from './index';
import { classifyMoves, getChainsAndLoops, MoveAnalysis, analyzeMove, getAllValidMoves } from './strategy';

export type BotDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface BotMoveResult {
    move: Move;
    explanation?: string;
}

export const getBotMove = (board: BoardState, difficulty: BotDifficulty): BotMoveResult => {
    const classification = classifyMoves(board);

    // 1. Always take scoring moves if available (except for specific Double Cross scenarios in HARD, but usually yes)
    // For MVP, even Hard bot takes boxes immediately.
    if (classification.scoringMoves.length > 0) {
        // Pick random scoring move? Or chain them?
        // Usually just pick one.
        const move = pickRandom(classification.scoringMoves);
        return { move, explanation: "Taking a completed box." };
    }

    // 2. EASY: Random valid move
    if (difficulty === 'EASY') {
        if (classification.validMoves.length === 0) throw new Error("No valid moves");
        return { move: pickRandom(classification.validMoves), explanation: "Random move." };
    }

    // 3. MEDIUM: Avoid sacrifices if possible
    if (difficulty === 'MEDIUM') {
        // Prefer safe moves
        if (classification.safeMoves.length > 0) {
            return { move: pickRandom(classification.safeMoves), explanation: "Playing a safe move." };
        }
        // If must sacrifice, random
        if (classification.sacrificeMoves.length > 0) {
            return { move: pickRandom(classification.sacrificeMoves), explanation: "Forced to sacrifice." };
        }
        // Fallback (should be covered by above)
        return { move: pickRandom(classification.validMoves), explanation: "Random fallback." };
    }

    // 4. HARD: Advanced Logic
    if (difficulty === 'HARD') {
        // Priority 1: Safe moves
        if (classification.safeMoves.length > 0) {
            // TODO: In future, pick safe move that maximizes future opportunities?
            // For now, random safe is good enough to beat novices.
            return { move: pickRandom(classification.safeMoves), explanation: "Playing a safe move to maintain control." };
        }

        // Priority 2: Forced to open a chain (sacrifice)
        // Heuristic: Open the shortest chain/loop to minimize opponent's gain.
        // Identify which move opens which chain?
        // This requires mapping moves to chains.

        // Let's refine: A sacrifice move is an edge in a 2-edge box that makes it a 3-edge box.
        // We want to find the chain this box belongs to.

        const chains = getChainsAndLoops(board);
        // Map moves to chain lengths?

        let bestSacrifice: Move | null = null;
        let minChainLen = Infinity;

        for (const move of classification.sacrificeMoves) {
            // Find which box this move affects (makes 3 edges)
            const analysis = analyzeMove(board, move);
            // analyzeMove doesn't tell us WHICH box became 3-edges, just that ONE did.
            // We need to inspect.

            // Simpler heuristic if too complex: Pick random sacrifice.
            // Better: Pick sacrifice that affects isolated box (chain len 1).

            // Let's use getChainsAndLoops logic. 
            // The "sacrificeMoves" are essentially moves that touch a component in `chains`.
            // We want to pick a move touching the smallest component.

            // Logic:
            // 1. Identify which chain each sacrifice move targets.
            // 2. Sort by chain length.
            // 3. Pick move for smallest chain.

            // Approximate: Just keys of 2-edge boxes.
            // The `chains` return `boxes`.
            // A sacrifice move must be an edge of one of these `boxes`.

            let targetChainLen = Infinity;

            // Check adjacent boxes of the move
            const affected: { r: number, c: number }[] = [];
            if (move.type === 'horizontal') {
                if (move.row > 0) affected.push({ r: move.row - 1, c: move.col });
                if (move.row < board.height - 1) affected.push({ r: move.row, c: move.col });
            } else {
                if (move.col > 0) affected.push({ r: move.row, c: move.col - 1 });
                if (move.col < board.width - 1) affected.push({ r: move.row, c: move.col });
            }

            for (const b of affected) {
                // Find chain containing b
                const chain = chains.find(ch => ch.boxes.some(box => box.row === b.r && box.col === b.c));
                if (chain) {
                    if (chain.boxes.length < targetChainLen) {
                        targetChainLen = chain.boxes.length;
                    }
                }
            }

            if (targetChainLen < minChainLen) {
                minChainLen = targetChainLen;
                bestSacrifice = move;
            }
        }

        if (bestSacrifice) {
            return { move: bestSacrifice, explanation: `Sacrificing smallest chain (length ${minChainLen}).` };
        }

        // Fallback
        return { move: pickRandom(classification.sacrificeMoves), explanation: "Forced sacrifice." };
    }

    return { move: classification.validMoves[0], explanation: "Fallback" };
};

const pickRandom = <T>(arr: T[]): T => {
    return arr[Math.floor(Math.random() * arr.length)];
};

export const getHint = (board: BoardState): BotMoveResult => {
    return getBotMove(board, 'HARD');
};
