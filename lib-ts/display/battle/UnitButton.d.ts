import * as PIXI from 'pixi.js';
export default class UnitButton extends PIXI.Sprite {
    slotIndex: number;
    unitId: number;
    init(slotIndex: number, unitId: number): void;
}
