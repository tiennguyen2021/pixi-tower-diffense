import AIWaveMaster from 'interfaces/master/AIWave';
import UnitMaster from 'interfaces/master/Unit';
import BattleManagerDelegate from 'interfaces/BattleManagerDelegate';
import UnitState from 'enum/UnitState';
import UnitEntity from 'entity/UnitEntity';
import Unit from 'display/battle/Unit';

const INVALID_UNIT_ID = -1;


class DefaultDelegator implements BattleManagerDelegate {
  public onUnitsSpawned(_units: Unit[]): void {}
  public onUnitStateChanged(_unit: Unit, _oldState: number): void {}
  public onUnitUpdated(_unit: Unit): void {}
  public onAvailableCostUpdated(_cost: number): void {}
  public shouldLock(_attacker: Unit, _target: Unit): boolean { return true; }
  public shouldDamage(_attacker: Unit, _target: Unit): boolean { return true; }
}

/**
 * ゲーム内バトルパートのマネージャ
 * ゲームロジックを中心に扱う
 * TODO: Although GameManager is singleton, BattleManager is expected to be used by creating instance.
 * So class name should be changed.
 */
export default class BattleManager {
  /**
   * フレームごとのコスト回復量
   */
  public costRecoveryPerFrame: number = 0;
  /**
   * 利用可能コストの上限値
   */
  public maxAvailableCost: number = 100;

  /**
   * BattleManagerDelegate 実装オブジェクト
   */
  private delegator: BattleManagerDelegate = new DefaultDelegator();

  /**
   * 現在の利用可能なコスト
   */
  private availableCost: number = 0;
  /**
   * 生成済みの Unit インスタンスを保持する配列
   */
  private units: Unit[] = [];
  /**
   * AIWaveMaster をキャッシュするための Map
   */
  private aiWaveMasterCache: Map<number, { unitId: number }[]> = new Map();
  /**
   * UnitMaster をキャッシュするための Map
   */
  private unitMasterCache: Map<number, UnitMaster> = new Map();
  /**
   * 外部から生成をリクエストされたユニット情報を保持する配列
   */
  private spawnRequestedUnitUnitIds: { unitId: number, isPlayer: boolean }[] = [];
  /**
   * 経過フレーム数
   */
  private passedFrameCount: number = 0;

  public init(aiWaveMaster: AIWaveMaster, unitMaster: UnitMaster[], delegator?: BattleManagerDelegate): void {
    this.aiWaveMasterCache.clear();
    this.unitMasterCache.clear();

    const waves = aiWaveMaster.waves;
    const keys = Object.keys(waves);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      this.aiWaveMasterCache.set(Number.parseInt(key), waves[key]);
    }

    for (let i = 0; i < unitMaster.length; i++) {
      const unit = unitMaster[i];
      this.unitMasterCache.set(unit.unitId, unit);
    }

    if (delegator) {
      this.delegator = delegator;
    }
  }

  public setDelegator(delegator: BattleManagerDelegate): void {
    this.delegator = delegator;
  }

  /**
   * Unit 生成をリクエストする
   */
  public requestSpawn(unitId: number, isPlayer: boolean): void {
    this.spawnRequestedUnitUnitIds.push({ unitId, isPlayer });
  }
  /**
   * Unit 生成をリクエストする
   * プレイヤーユニット生成リクエストのシュガー
   */
  public requestSpawnPlayer(unitId: number): void {
    this.requestSpawn(unitId, true);
  }
  /**
   * Unit 生成をリクエストする
   * AIユニット生成リクエストのシュガー
   */
  public requestSpawnAI(unitId: number): void {
    this.requestSpawn(unitId, false);
  }

  /**
   * コストを消費し、Unit 生成を試みる
   * コストが足りなければ何もしない
   */
  public trySpawn(unitId: number, isPlayer: boolean): Unit | null {
    const master = this.unitMasterCache.get(unitId);
    if (!master) {
      return null;
    }

    if (isPlayer) {
      if (this.availableCost < master.cost) {
        return null;
      }
      this.refreshAvailableCost(this.availableCost - master.cost);
    }

    const unit = new Unit(master, isPlayer);
    unit.id = this.units.length;
    unit.currentHealth = unit.maxHealth;
    unit.state = UnitState.IDLE;
    this.units.push(unit);
    return unit;
  }

  /**
   * 渡された Unit が、ロジック上死亡扱いであるかどうかを返す
   */
  public isDied(unit: UnitEntity): boolean {
    return unit.id === INVALID_UNIT_ID;
  }

  /**
   * ゲーム更新処理
   * 外部から適切なタイミングでコールされる
   */
  public update(_delta: number): void {
    this.refreshAvailableCost(this.availableCost + this.costRecoveryPerFrame);

    this.requestAISpawn(this.passedFrameCount);

    this.updateSpawnRequest();

    const activeUnits = [];

    // update units
    for (let i = 0; i < this.units.length; i++) {
      const unit = this.units[i];

      // update parameter
      if (!this.isDied(unit)) {
        this.updateDamage(unit);
        this.updateState(unit);
      }

      this.delegator.onUnitUpdated(unit);

      if (!this.isDied(unit)) {
        activeUnits.push(unit);
      }
    }

    this.units = activeUnits;

    this.passedFrameCount++;
  }

  private updateDamage(unit: Unit): void {
    if (unit.state !== UnitState.LOCKED) {
      return;
    }

    for (let i = 0; i < this.units.length; i++) {
      const target = this.units[i];
      if (unit.isAlly(target)) {
        continue;
      }
      if (this.delegator.shouldDamage(unit, target)) {
        target.currentHealth -= unit.power;
      }
    }
  }

  /**
   * Unit のステートを更新する
   * ステート優先順位は右記の通り DEAD > LOCKED > IDLE
   */
  private updateState(unit: Unit): void {
    const oldState = unit.state;
    let newState = oldState;

    do {
      if (unit.state === UnitState.DEAD) {
        break;
      }
      if (unit.currentHealth <= 0) {
        unit.id = INVALID_UNIT_ID;
        newState = UnitState.DEAD;
        break;
      }

      for (let i = 0; i < this.units.length; i++) {
        const target = this.units[i];
        if (unit.isAlly(target)) {
          continue;
        }
        if (target.state !== UnitState.IDLE && target.state !== UnitState.LOCKED) {
          continue;
        }

        if (this.delegator.shouldLock(unit, target)) {
          newState = UnitState.LOCKED;
          break;
        }
      }
    } while(false);

    if (newState !== oldState) {
      unit.state = newState;
      this.delegator.onUnitStateChanged(unit, oldState);
    }
  }

  private requestAISpawn(targetFrame: number): void {
    const waves = this.aiWaveMasterCache.get(targetFrame);
    if (!waves) {
      return;
    }

    for (let i = 0; i < waves.length; i++) {
      const unitId = waves[i].unitId;
      this.requestSpawnAI(unitId);
    }
  }

  /**
   * 受け付けた Unit 生成リクエストを処理する
   */
  private updateSpawnRequest(): void {
    if (this.spawnRequestedUnitUnitIds.length === 0) {
      return;
    }

    const spawnedUnits = [];
    for (let i = 0; i < this.spawnRequestedUnitUnitIds.length; i++) {
      const reservedUnit = this.spawnRequestedUnitUnitIds[i];
      const unit = this.trySpawn(reservedUnit.unitId, reservedUnit.isPlayer);
      if (unit) {
        spawnedUnits.push(unit);
      }
    }

    this.spawnRequestedUnitUnitIds = [];

    if (spawnedUnits.length === 0) {
      return;
    }

    this.delegator.onUnitsSpawned(spawnedUnits);
  }

  /**
   * 利用可能なコストを更新し、専用のコールバックをコールする
   */
  private refreshAvailableCost(newCost: number): number {
    if (newCost > this.maxAvailableCost) {
      newCost = this.maxAvailableCost;
    }
    this.availableCost = newCost;
    this.delegator.onAvailableCostUpdated(this.availableCost);

    return this.availableCost;
  }
}
