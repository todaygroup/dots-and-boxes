export class MakeMoveDto {
    type: 'vertical' | 'horizontal';
    row: number;
    col: number;
    playerIndex: 0 | 1; // 0 or 1
}
