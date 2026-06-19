import { Fragment, Material, WorkshopRecipe } from '../types/GameTypes';

export const Fragments: Fragment[] = [
  { id: 1, specimenId: 1, name: '银杏叶片碎片', rarity: 'common' },
  { id: 2, specimenId: 1, name: '银杏树干碎片', rarity: 'rare' },
  { id: 3, specimenId: 2, name: '玫瑰花瓣碎片', rarity: 'common' },
  { id: 4, specimenId: 2, name: '玫瑰茎叶碎片', rarity: 'rare' },
  { id: 5, specimenId: 3, name: '向日葵花瓣碎片', rarity: 'common' },
  { id: 6, specimenId: 3, name: '向日葵花盘碎片', rarity: 'rare' },
  { id: 7, specimenId: 4, name: '薰衣草花穗碎片', rarity: 'common' },
  { id: 8, specimenId: 4, name: '薰衣草茎秆碎片', rarity: 'rare' },
  { id: 9, specimenId: 5, name: '兰花花瓣碎片', rarity: 'common' },
  { id: 10, specimenId: 5, name: '兰花根茎碎片', rarity: 'epic' },
  { id: 11, specimenId: 6, name: '多肉叶片碎片', rarity: 'common' },
  { id: 12, specimenId: 6, name: '多肉根系碎片', rarity: 'epic' },
];

export const Materials: Material[] = [
  { id: 1, name: '修复胶水', icon: '🧴', description: '基础修复材料，用于粘合碎片' },
  { id: 2, name: '植物染料', icon: '🎨', description: '还原标本色彩的材料' },
  { id: 3, name: '防腐药剂', icon: '🧪', description: '高级修复材料，防止标本退化' },
  { id: 4, name: '金箔粉', icon: '✨', description: '珍稀材料，用于珍稀标本修复' },
];

export const WorkshopRecipes: WorkshopRecipe[] = [
  {
    specimenId: 1,
    requiredFragments: [
      { fragmentId: 1, count: 3 },
      { fragmentId: 2, count: 1 },
    ],
    requiredMaterials: [
      { materialId: 1, count: 2 },
      { materialId: 2, count: 1 },
    ],
  },
  {
    specimenId: 2,
    requiredFragments: [
      { fragmentId: 3, count: 3 },
      { fragmentId: 4, count: 1 },
    ],
    requiredMaterials: [
      { materialId: 1, count: 2 },
      { materialId: 2, count: 1 },
    ],
  },
  {
    specimenId: 3,
    requiredFragments: [
      { fragmentId: 5, count: 3 },
      { fragmentId: 6, count: 1 },
    ],
    requiredMaterials: [
      { materialId: 1, count: 3 },
      { materialId: 2, count: 2 },
      { materialId: 3, count: 1 },
    ],
  },
  {
    specimenId: 4,
    requiredFragments: [
      { fragmentId: 7, count: 3 },
      { fragmentId: 8, count: 1 },
    ],
    requiredMaterials: [
      { materialId: 1, count: 3 },
      { materialId: 2, count: 2 },
      { materialId: 3, count: 1 },
    ],
  },
  {
    specimenId: 5,
    requiredFragments: [
      { fragmentId: 9, count: 4 },
      { fragmentId: 10, count: 2 },
    ],
    requiredMaterials: [
      { materialId: 1, count: 4 },
      { materialId: 2, count: 3 },
      { materialId: 3, count: 2 },
      { materialId: 4, count: 1 },
    ],
  },
  {
    specimenId: 6,
    requiredFragments: [
      { fragmentId: 11, count: 4 },
      { fragmentId: 12, count: 2 },
    ],
    requiredMaterials: [
      { materialId: 1, count: 4 },
      { materialId: 2, count: 3 },
      { materialId: 3, count: 2 },
      { materialId: 4, count: 1 },
    ],
  },
];

export const DropRules: {
  difficulty: 'easy' | 'medium' | 'hard';
  stars: number;
  fragmentDrops: { rarity: 'common' | 'rare' | 'epic'; minCount: number; maxCount: number }[];
  materialDrops: { materialId: number; minCount: number; maxCount: number }[];
}[] = [
  {
    difficulty: 'easy',
    stars: 1,
    fragmentDrops: [{ rarity: 'common', minCount: 1, maxCount: 2 }],
    materialDrops: [{ materialId: 1, minCount: 1, maxCount: 2 }],
  },
  {
    difficulty: 'easy',
    stars: 2,
    fragmentDrops: [
      { rarity: 'common', minCount: 2, maxCount: 3 },
      { rarity: 'rare', minCount: 0, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 1, maxCount: 2 },
      { materialId: 2, minCount: 0, maxCount: 1 },
    ],
  },
  {
    difficulty: 'easy',
    stars: 3,
    fragmentDrops: [
      { rarity: 'common', minCount: 2, maxCount: 3 },
      { rarity: 'rare', minCount: 1, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 2, maxCount: 3 },
      { materialId: 2, minCount: 1, maxCount: 1 },
    ],
  },
  {
    difficulty: 'medium',
    stars: 1,
    fragmentDrops: [
      { rarity: 'common', minCount: 1, maxCount: 2 },
      { rarity: 'rare', minCount: 0, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 1, maxCount: 2 },
      { materialId: 2, minCount: 0, maxCount: 1 },
    ],
  },
  {
    difficulty: 'medium',
    stars: 2,
    fragmentDrops: [
      { rarity: 'common', minCount: 2, maxCount: 3 },
      { rarity: 'rare', minCount: 1, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 2, maxCount: 3 },
      { materialId: 2, minCount: 1, maxCount: 2 },
      { materialId: 3, minCount: 0, maxCount: 1 },
    ],
  },
  {
    difficulty: 'medium',
    stars: 3,
    fragmentDrops: [
      { rarity: 'common', minCount: 2, maxCount: 3 },
      { rarity: 'rare', minCount: 1, maxCount: 2 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 2, maxCount: 3 },
      { materialId: 2, minCount: 1, maxCount: 2 },
      { materialId: 3, minCount: 1, maxCount: 1 },
    ],
  },
  {
    difficulty: 'hard',
    stars: 1,
    fragmentDrops: [
      { rarity: 'common', minCount: 1, maxCount: 2 },
      { rarity: 'rare', minCount: 0, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 1, maxCount: 2 },
      { materialId: 2, minCount: 0, maxCount: 1 },
    ],
  },
  {
    difficulty: 'hard',
    stars: 2,
    fragmentDrops: [
      { rarity: 'common', minCount: 2, maxCount: 3 },
      { rarity: 'rare', minCount: 1, maxCount: 2 },
      { rarity: 'epic', minCount: 0, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 2, maxCount: 3 },
      { materialId: 2, minCount: 1, maxCount: 2 },
      { materialId: 3, minCount: 0, maxCount: 1 },
    ],
  },
  {
    difficulty: 'hard',
    stars: 3,
    fragmentDrops: [
      { rarity: 'common', minCount: 3, maxCount: 4 },
      { rarity: 'rare', minCount: 1, maxCount: 2 },
      { rarity: 'epic', minCount: 0, maxCount: 1 },
    ],
    materialDrops: [
      { materialId: 1, minCount: 3, maxCount: 4 },
      { materialId: 2, minCount: 2, maxCount: 3 },
      { materialId: 3, minCount: 1, maxCount: 2 },
      { materialId: 4, minCount: 0, maxCount: 1 },
    ],
  },
];

export function getFragmentById(id: number): Fragment | undefined {
  return Fragments.find(f => f.id === id);
}

export function getFragmentsBySpecimenId(specimenId: number): Fragment[] {
  return Fragments.filter(f => f.specimenId === specimenId);
}

export function getMaterialById(id: number): Material | undefined {
  return Materials.find(m => m.id === id);
}

export function getRecipeBySpecimenId(specimenId: number): WorkshopRecipe | undefined {
  return WorkshopRecipes.find(r => r.specimenId === specimenId);
}

export function getDropRule(difficulty: 'easy' | 'medium' | 'hard', stars: number) {
  return DropRules.find(r => r.difficulty === difficulty && r.stars === stars);
}

export function getRarityColor(rarity: 'common' | 'rare' | 'epic'): number {
  switch (rarity) {
    case 'common': return 0x4caf50;
    case 'rare': return 0x2196f3;
    case 'epic': return 0x9c27b0;
  }
}

export function getRarityText(rarity: 'common' | 'rare' | 'epic'): string {
  switch (rarity) {
    case 'common': return '普通';
    case 'rare': return '稀有';
    case 'epic': return '史诗';
  }
}
