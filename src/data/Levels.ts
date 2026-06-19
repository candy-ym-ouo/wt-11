import { LevelData, GalleryItem } from '../types/GameTypes';

export const Levels: LevelData[] = [
  {
    id: 1,
    name: '第一关',
    description: '修复一片银杏叶标本',
    plantName: '银杏',
    plantFamily: '银杏科',
    difficulty: 'easy',
    timeLimit: 180,
    rows: 2,
    cols: 2,
    targetImage: 'level1-target',
    previewImage: 'level1-preview',
    pieces: [
      { id: 0, x: 375, y: 500, rotation: 0, width: 150, height: 200, textureKey: 'level1-pieces', frameIndex: 0 },
      { id: 1, x: 375, y: 700, rotation: 0, width: 150, height: 200, textureKey: 'level1-pieces', frameIndex: 1 },
      { id: 2, x: 375, y: 900, rotation: 0, width: 150, height: 200, textureKey: 'level1-pieces', frameIndex: 2 },
      { id: 3, x: 375, y: 1100, rotation: 0, width: 150, height: 200, textureKey: 'level1-pieces', frameIndex: 3 }
    ]
  },
  {
    id: 2,
    name: '第二关',
    description: '修复一朵玫瑰花标本',
    plantName: '玫瑰',
    plantFamily: '蔷薇科',
    difficulty: 'easy',
    timeLimit: 180,
    rows: 2,
    cols: 3,
    targetImage: 'level2-target',
    previewImage: 'level2-preview',
    pieces: [
      { id: 0, x: 375, y: 450, rotation: 0, width: 120, height: 160, textureKey: 'level2-pieces', frameIndex: 0 },
      { id: 1, x: 375, y: 620, rotation: 0, width: 120, height: 160, textureKey: 'level2-pieces', frameIndex: 1 },
      { id: 2, x: 375, y: 790, rotation: 0, width: 120, height: 160, textureKey: 'level2-pieces', frameIndex: 2 },
      { id: 3, x: 375, y: 960, rotation: 0, width: 120, height: 160, textureKey: 'level2-pieces', frameIndex: 3 },
      { id: 4, x: 375, y: 1130, rotation: 0, width: 120, height: 160, textureKey: 'level2-pieces', frameIndex: 4 },
      { id: 5, x: 375, y: 1280, rotation: 0, width: 120, height: 160, textureKey: 'level2-pieces', frameIndex: 5 }
    ]
  },
  {
    id: 3,
    name: '第三关',
    description: '修复一株向日葵标本',
    plantName: '向日葵',
    plantFamily: '菊科',
    difficulty: 'medium',
    timeLimit: 240,
    rows: 3,
    cols: 3,
    targetImage: 'level3-target',
    previewImage: 'level3-preview',
    pieces: [
      { id: 0, x: 375, y: 400, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 0 },
      { id: 1, x: 375, y: 540, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 1 },
      { id: 2, x: 375, y: 680, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 2 },
      { id: 3, x: 375, y: 820, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 3 },
      { id: 4, x: 375, y: 960, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 4 },
      { id: 5, x: 375, y: 1100, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 5 },
      { id: 6, x: 375, y: 1240, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 6 },
      { id: 7, x: 375, y: 1380, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 7 },
      { id: 8, x: 375, y: 1520, rotation: 0, width: 100, height: 130, textureKey: 'level3-pieces', frameIndex: 8 }
    ]
  },
  {
    id: 4,
    name: '第四关',
    description: '修复一株薰衣草标本',
    plantName: '薰衣草',
    plantFamily: '唇形科',
    difficulty: 'medium',
    timeLimit: 240,
    rows: 3,
    cols: 4,
    targetImage: 'level4-target',
    previewImage: 'level4-preview',
    pieces: []
  },
  {
    id: 5,
    name: '第五关',
    description: '修复一株兰花标本',
    plantName: '兰花',
    plantFamily: '兰科',
    difficulty: 'hard',
    timeLimit: 300,
    rows: 4,
    cols: 4,
    targetImage: 'level5-target',
    previewImage: 'level5-preview',
    pieces: []
  },
  {
    id: 6,
    name: '第六关',
    description: '修复一株多肉植物标本',
    plantName: '多肉植物',
    plantFamily: '景天科',
    difficulty: 'hard',
    timeLimit: 300,
    rows: 4,
    cols: 5,
    targetImage: 'level6-target',
    previewImage: 'level6-preview',
    pieces: []
  }
];

export const GalleryItems: GalleryItem[] = Levels.map(level => ({
  id: level.id,
  name: level.plantName,
  family: level.plantFamily,
  description: level.description,
  image: level.targetImage,
  unlocked: false
}));

export function getLevelById(id: number): LevelData | undefined {
  return Levels.find(level => level.id === id);
}
