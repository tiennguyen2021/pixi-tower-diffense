import Config from  'Config';
import Scene from  'scenes/Scene';

/**
 * リソースの URL や命名規則のマスタ
 */
const ResourceMaster = Object.freeze({
  /**
   * マスターデータ API 情報を有するオブジェクト
   */
  Api: {
    SceneUiGraph: (scene: Scene): string => {
      const snake_case = scene.constructor.name.replace(
        /([A-Z])/g,
        (s) => { return `_${s.charAt(0).toLowerCase()}`; }
      ).replace(/^_/, '');

      return `${Config.ResourceBaseUrl}/ui_graph/${snake_case}.json`;
    },
    Field: (fieldId: number): string => {
      const query = `?fieldId=${fieldId}`;
      return `${Config.ResourceBaseUrl}/master/field_master.json${query}`;
    },
    AiWave: (stageId: number): string => {
      const query = `?stageId=${stageId}`;
      return `${Config.ResourceBaseUrl}/master/ai_wave_master.json${query}`;
    },
    Unit: (unitIds: number[]): string => {
      const joinedUnitIds = unitIds.join('&unitId[]=');
      return `${Config.ResourceBaseUrl}/master/unit_master.json?unitId[]=${joinedUnitIds}`;
    },
    Base: (playerBaseId: number, aiBaseId: number): string => {
      const query = `?playerBaseId=${playerBaseId}&aiBaseId=${aiBaseId}`;
      return `${Config.ResourceBaseUrl}/master/base_master.json${query}`;
    }
  },

  /**
   * 渡されたパラメータによって動的に変わる url を有するオブジェクト
   */
  Dynamic: {
    Unit: (unitId: number): string => {
      return `${Config.ResourceBaseUrl}/units/${unitId}.json`;
    },
    UnitPanel: (unitId?: number): string => {
      const id = unitId ? unitId : 'empty';
      return `${Config.ResourceBaseUrl}/ui/units_panel/button/unit_${id}.png`;
    },
    Base: (baseId: number): string => {
      return `${Config.ResourceBaseUrl}/battle/base/${baseId}.json`;
    }
  },
  /**
   * 静的なリソースを有するオブジェクト
   */
  Static: {
    BattleBgFores: [
      `${Config.ResourceBaseUrl}/battle/bg_1_1.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_2.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_3.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_4.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_5.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_6.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_7.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_8.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_9.png`,
      `${Config.ResourceBaseUrl}/battle/bg_1_10.png`
    ],
    BattleBgMiddles: [
      `${Config.ResourceBaseUrl}/battle/bg_2_1.png`,
      `${Config.ResourceBaseUrl}/battle/bg_2_2.png`,
      `${Config.ResourceBaseUrl}/battle/bg_2_3.png`,
      `${Config.ResourceBaseUrl}/battle/bg_2_4.png`,
      `${Config.ResourceBaseUrl}/battle/bg_2_5.png`,
      `${Config.ResourceBaseUrl}/battle/bg_2_6.png`
    ],
    BattleBgBacks: [
      `${Config.ResourceBaseUrl}/battle/bg_3_1.png`,
      `${Config.ResourceBaseUrl}/battle/bg_3_2.png`,
      `${Config.ResourceBaseUrl}/battle/bg_3_3.png`
    ],
    AttackSmoke:
      `${Config.ResourceBaseUrl}/battle/effects/attack_smoke/attack_smoke.json`,
    DeadBucket:
      `${Config.ResourceBaseUrl}/battle/effects/dead/dead_bucket.png`,
    DeadSpirit:
      `${Config.ResourceBaseUrl}/battle/effects/dead/dead_spirit.png`,
    CollapseExplode:
      `${Config.ResourceBaseUrl}/battle/effects/collapse_explode/collapse_explode.json`,
    BattleResultWin:
      `${Config.ResourceBaseUrl}/ui/battle_win.png`,
    BattleResultLose:
      `${Config.ResourceBaseUrl}/ui/battle_lose.png`
  },
  /**
   * サウンドリソースの静的な url を有するオブジェクト
   */
  Audio: {
    Bgm: {
      Title: `${Config.ResourceBaseUrl}/audio/bgm_title.mp3`,
      Battle: `${Config.ResourceBaseUrl}/audio/bgm_battle.mp3`
    },
    Se: {
      Attack1: `${Config.ResourceBaseUrl}/audio/se_attack_1.mp3`,
      Attack2: `${Config.ResourceBaseUrl}/audio/se_attack_2.mp3`,
      Bomb: `${Config.ResourceBaseUrl}/audio/se_bomb.mp3`,
      UnitSpawn: `${Config.ResourceBaseUrl}/audio/se_unit_spawn.mp3`,
      Win: `${Config.ResourceBaseUrl}/audio/se_win.mp3`,
      Lose: `${Config.ResourceBaseUrl}/audio/se_lose.mp3`
    }
  },

  /**
   * テクスチャのフレーム名を返す関数を有するオブジェクト
   */
  TextureFrame: {
    Unit: (unitActionType: string, unitId: number, index: number): PIXI.Texture => {
      return PIXI.utils.TextureCache[`unit_${unitId}_${unitActionType}_${index}.png`];
    },
    Base: (baseId: number, index: number = 1): PIXI.Texture => {
      return PIXI.utils.TextureCache[`base_${baseId}_${index}.png`];
    },
    CollapseExplode: (index: number = 1): PIXI.Texture => {
      return PIXI.utils.TextureCache[`effect_1_${index}.png`];
    },
    AttackSmoke: (index: number = 1): PIXI.Texture => {
      return PIXI.utils.TextureCache[`effect_2_${index}.png`];
    }
  },

  /**
   * アニメーション種別の識別子を有するオブジェクト
   */
  AnimationTypes: {
    Unit: Object.freeze({
      WAIT: 'wait',
      WALK: 'walk',
      ATTACK: 'attack',
      DAMAGE: 'damage'
    }),
    Base: Object.freeze({
      IDLE: 'idle',
      SPAWN: 'spawn',
      COLLAPSE: 'collapse'
    })
  },

  /**
   * スプライトシートの最大フレーム数を返す関数
   */
  MaxFrameIndex: (resourceKey: string): number => {
    const json = PIXI.loader.resources[resourceKey];
    if (!json || !json.data || !json.data.frames) {
      return -1;
    }
    return Object.keys(json.data.frames).length;
  }
});

export default ResourceMaster;
