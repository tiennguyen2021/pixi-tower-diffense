import * as PIXI from 'pixi.js';
import ResourceMaster from 'ResourceMaster';
import BaseEntity from 'entity/BaseEntity';
import CollapseExplodeEffect from 'display/battle/effect/CollapseExplodeEffect';

const baseId1SpawnFrameCount = 16;

/**
 * ユニットの振舞い、及び見た目に関する処理を行う
 * UnitEntity を継承する
 */
export default class Base extends BaseEntity {
  /**
   * PIXI スプライト
   */
  public sprite!: PIXI.Sprite;
  /**
   * 爆発エフェクト用コンテナ
   */
  public explodeContainer: PIXI.Container = new PIXI.Container();

  /**
   * 初期座標、アニメーションなどで更新されるため覚えておく
   */
  protected originalPositon: PIXI.Point = new PIXI.Point();
  /**
   * 現在のアニメーション種別
   */
  protected animationType: string = ResourceMaster.Base.AnimationTypes.IDLE;
  /**
   * 現在の経過フレーム数
   */
  protected elapsedFrameCount: number = 0;

  constructor(baseId: number, isPlayer: boolean) {
    super(baseId, isPlayer);

    this.sprite = new PIXI.Sprite(PIXI.utils.TextureCache[ResourceMaster.Base.TextureFrameName(baseId)]);
    if (!isPlayer) {
      this.sprite.scale.x  = -1.0;
    }

    this.sprite.anchor.x = 0.5;
    this.sprite.anchor.y = 1.0;
  }

  public init(options?: any): void {
    switch (this.baseId) {
      case 1: this.sprite.position.y = 300; break;
      case 2:
      default: this.sprite.position.y = 200; break;
    }

    if (options && options.x) {
      this.sprite.position.x = options.x;
    }

    this.originalPositon.set(this.sprite.position.x, this.sprite.position.y);
  }

  public resetAnimation(): void {
    this.animationType = ResourceMaster.Base.AnimationTypes.IDLE;
    this.elapsedFrameCount = 0;
  }
  public setAnimation(type: string): void {
    this.animationType = type;
    this.elapsedFrameCount = 0;
  }

  public updateAnimation(type?: string): void {
    if (type) {
      this.animationType = type;
    }

    switch (this.animationType) {
      case ResourceMaster.Base.AnimationTypes.COLLAPSE: {
        this.explodeContainer.position.set(
          this.sprite.position.x - this.sprite.width * this.sprite.anchor.x,
          this.sprite.position.y - this.sprite.height * this.sprite.anchor.y
        );
        if ((this.elapsedFrameCount % 10) === 0) {
          this.spawnCollapseExplode();
        }
        this.sprite.position.x = this.sprite.position.x + 4 * ((this.elapsedFrameCount % 2 === 0) ? 1 : -1);
        break;
      }
      case ResourceMaster.Base.AnimationTypes.SPAWN: {
        if (this.baseId === 1) {
          const cacheName = ResourceMaster.Base.TextureFrameName(this.baseId, 2);
          this.sprite.texture = PIXI.utils.TextureCache[cacheName];

          if (this.elapsedFrameCount >= baseId1SpawnFrameCount) {
            this.resetAnimation();
          }
        } else {
          this.animationType = ResourceMaster.Base.AnimationTypes.IDLE;
        }
        break;
      }
      case ResourceMaster.Base.AnimationTypes.IDLE:
      default: {
        if (this.baseId === 1) {
          const cacheName = ResourceMaster.Base.TextureFrameName(this.baseId, 1);
          this.sprite.texture = PIXI.utils.TextureCache[cacheName];
        } else if (this.baseId === 2) {
          const r  = 20;  // range
          const t  = 400; // duration

          this.sprite.position.y = this.originalPositon.y + -r * Math.sin((2 * Math.PI / t) * this.elapsedFrameCount);
        }

        break;
      }
    }

    for (let i = 0; i < this.explodeContainer.children.length; i++) {
      const effect = this.explodeContainer.children[i];
      (effect as CollapseExplodeEffect).update(1);
    }

    this.elapsedFrameCount++;
  }

  private spawnCollapseExplode(): void {
    const scale = 1.0 + Math.random() % 0.8 - 0.4;

    const effect = new CollapseExplodeEffect();
    effect.position.x = Math.random() * this.sprite.width;
    effect.position.y = Math.random() * this.sprite.height;
    effect.scale.set(scale);

    this.explodeContainer.addChild(effect);
  }
}