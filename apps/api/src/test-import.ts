import { BoardState, createBoard } from '@dots-game/game-logic';

try {
    const board: BoardState = createBoard(3, 3);
    console.log('Board created successfully:', board.width);
} catch (e) {
    console.error('Error:', e);
}
