import UpdateObject from 'display/UpdateObject';
export default class CollapseExplodeEffect extends UpdateObject {
    private elapsedFrameCount;
    private sprite;
    static readonly resourceList: string[];
    constructor();
    update(_delta: number): void;
}