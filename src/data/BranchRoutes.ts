import { BranchRouteData, BranchRouteType, MapNodeData, EndingData, Reward } from '../types/GameTypes';

export const FlowerRouteNodes: MapNodeData[] = [
  {
    id: 'flower_start',
    type: 'story',
    name: '花之序曲',
    description: '欢迎来到花卉世界，开启你的芬芳之旅',
    x: 375,
    y: 200,
    storyContent: '在这片神奇的花园中，每一朵花都有自己的故事。作为一名植物学家，你的任务是修复这些珍贵的花卉标本，揭开它们背后的秘密...',
    icon: '🌸'
  },
  {
    id: 'flower_level_1',
    type: 'level',
    name: '初绽·玫瑰',
    description: '修复第一朵玫瑰标本',
    x: 300,
    y: 350,
    levelId: 1,
    icon: '🌹'
  },
  {
    id: 'flower_story_1',
    type: 'story',
    name: '花园漫步',
    description: '发现更多花卉的秘密',
    x: 450,
    y: 480,
    storyContent: '沿着花园小径前行，你发现了更多美丽的花卉。每一朵花都蕴含着大自然的智慧，等待你去探索...',
    icon: '🌺'
  },
  {
    id: 'flower_level_2',
    type: 'level',
    name: '向阳·向日葵',
    description: '修复向日葵标本',
    x: 280,
    y: 600,
    levelId: 3,
    icon: '🌻'
  },
  {
    id: 'flower_reward_1',
    type: 'reward',
    name: '花匠徽章',
    description: '解锁花卉专家奖励',
    x: 470,
    y: 720,
    rewards: [
      { type: 'badge', id: 301, name: '花匠学徒', description: '完成花卉路线前半段' }
    ],
    icon: '🎖️'
  },
  {
    id: 'flower_level_3',
    type: 'boss',
    name: '幽兰·兰花',
    description: '挑战稀有兰花标本',
    x: 320,
    y: 850,
    levelId: 5,
    icon: '🌸'
  },
  {
    id: 'flower_ending',
    type: 'ending',
    name: '花之终章',
    description: '完成花卉路线，解锁专属结局',
    x: 375,
    y: 1000,
    endingId: 'flower_ending',
    icon: '🏆'
  }
];

export const TreeRouteNodes: MapNodeData[] = [
  {
    id: 'tree_start',
    type: 'story',
    name: '森林入口',
    description: '踏入古老森林，探索树木的奥秘',
    x: 375,
    y: 200,
    storyContent: '参天古木，岁月悠悠。在这片神秘的森林中，每一棵树木都见证了时光的流转。作为植物学家，你将深入森林，修复古老的树木标本...',
    icon: '🌲'
  },
  {
    id: 'tree_level_1',
    type: 'level',
    name: '活化石·银杏',
    description: '修复银杏标本',
    x: 280,
    y: 350,
    levelId: 1,
    icon: '🍂'
  },
  {
    id: 'tree_story_1',
    type: 'story',
    name: '林间小径',
    description: '聆听森林的低语',
    x: 470,
    y: 480,
    storyContent: '阳光透过树叶洒下斑驳的光影，微风中带着泥土的芬芳。森林深处似乎隐藏着更多秘密...',
    icon: '🌳'
  },
  {
    id: 'tree_level_2',
    type: 'level',
    name: '多肉·景天',
    description: '修复多肉植物标本',
    x: 300,
    y: 600,
    levelId: 6,
    icon: '🌵'
  },
  {
    id: 'tree_reward_1',
    type: 'reward',
    name: '森林守护者',
    description: '解锁树木专家奖励',
    x: 450,
    y: 720,
    rewards: [
      { type: 'badge', id: 302, name: '森林守护者', description: '完成树木路线前半段' }
    ],
    icon: '🛡️'
  },
  {
    id: 'tree_level_3',
    type: 'boss',
    name: '古树之谜',
    description: '挑战神秘古树标本',
    x: 350,
    y: 850,
    levelId: 5,
    icon: '🌴'
  },
  {
    id: 'tree_ending',
    type: 'ending',
    name: '森林之心',
    description: '完成树木路线，解锁专属结局',
    x: 375,
    y: 1000,
    endingId: 'tree_ending',
    icon: '🏆'
  }
];

export const HerbRouteNodes: MapNodeData[] = [
  {
    id: 'herb_start',
    type: 'story',
    name: '香草园',
    description: '进入芬芳的香草世界',
    x: 375,
    y: 200,
    storyContent: '薰衣草的芬芳、薄荷的清凉...香草园中蕴含着大自然的疗愈力量。作为植物学家，你将学习各种香草的特性，修复珍贵的草本标本...',
    icon: '🌿'
  },
  {
    id: 'herb_level_1',
    type: 'level',
    name: '芬芳·薰衣草',
    description: '修复薰衣草标本',
    x: 450,
    y: 350,
    levelId: 4,
    icon: '💜'
  },
  {
    id: 'herb_story_1',
    type: 'story',
    name: '草药小径',
    description: '发现草本植物的妙用',
    x: 280,
    y: 480,
    storyContent: '沿着香草小径前行，各种草本植物散发着独特的香气。有些可以入药，有些可以调味，每一种都有其独特的价值...',
    icon: '🌱'
  },
  {
    id: 'herb_level_2',
    type: 'level',
    name: '多肉·景天',
    description: '修复多肉植物标本',
    x: 420,
    y: 600,
    levelId: 6,
    icon: '🪴'
  },
  {
    id: 'herb_reward_1',
    type: 'reward',
    name: '草药师徽章',
    description: '解锁草本专家奖励',
    x: 280,
    y: 720,
    rewards: [
      { type: 'badge', id: 303, name: '草药师学徒', description: '完成草本路线前半段' }
    ],
    icon: '🧪'
  },
  {
    id: 'herb_level_3',
    type: 'boss',
    name: '幽兰·兰花',
    description: '挑战稀有草本植物',
    x: 400,
    y: 850,
    levelId: 5,
    icon: '🌺'
  },
  {
    id: 'herb_ending',
    type: 'ending',
    name: '百草全书',
    description: '完成草本路线，解锁专属结局',
    x: 375,
    y: 1000,
    endingId: 'herb_ending',
    icon: '🏆'
  }
];

export const FlowerRouteConnections = [
  { from: 'flower_start', to: 'flower_level_1' },
  { from: 'flower_level_1', to: 'flower_story_1' },
  { from: 'flower_story_1', to: 'flower_level_2' },
  { from: 'flower_level_2', to: 'flower_reward_1' },
  { from: 'flower_reward_1', to: 'flower_level_3' },
  { from: 'flower_level_3', to: 'flower_ending' }
];

export const TreeRouteConnections = [
  { from: 'tree_start', to: 'tree_level_1' },
  { from: 'tree_level_1', to: 'tree_story_1' },
  { from: 'tree_story_1', to: 'tree_level_2' },
  { from: 'tree_level_2', to: 'tree_reward_1' },
  { from: 'tree_reward_1', to: 'tree_level_3' },
  { from: 'tree_level_3', to: 'tree_ending' }
];

export const HerbRouteConnections = [
  { from: 'herb_start', to: 'herb_level_1' },
  { from: 'herb_level_1', to: 'herb_story_1' },
  { from: 'herb_story_1', to: 'herb_level_2' },
  { from: 'herb_level_2', to: 'herb_reward_1' },
  { from: 'herb_reward_1', to: 'herb_level_3' },
  { from: 'herb_level_3', to: 'herb_ending' }
];

export const BranchRoutes: Record<BranchRouteType, BranchRouteData> = {
  flower: {
    id: 'flower',
    name: '花卉之路',
    description: '探索绚丽多彩的花卉世界，修复玫瑰、向日葵、兰花等美丽花卉标本',
    theme: '花卉',
    primaryColor: 0xe91e63,
    secondaryColor: 0xff69b4,
    accentColor: 0xffeb3b,
    icon: '🌸',
    backgroundPattern: 'flower',
    nodes: FlowerRouteNodes,
    connections: FlowerRouteConnections,
    startingNodeId: 'flower_start',
    endingNodeId: 'flower_ending',
    totalLevels: 3,
    requiredStars: 0,
    unlocked: true
  },
  tree: {
    id: 'tree',
    name: '森林之路',
    description: '深入神秘森林，探索银杏、多肉等树木植物的古老秘密',
    theme: '树木',
    primaryColor: 0x4caf50,
    secondaryColor: 0x81c784,
    accentColor: 0x795548,
    icon: '🌲',
    backgroundPattern: 'tree',
    nodes: TreeRouteNodes,
    connections: TreeRouteConnections,
    startingNodeId: 'tree_start',
    endingNodeId: 'tree_ending',
    totalLevels: 3,
    requiredStars: 3,
    unlocked: false
  },
  herb: {
    id: 'herb',
    name: '香草之路',
    description: '漫步芬芳的香草园，学习薰衣草、多肉等草本植物的奇妙用途',
    theme: '草本',
    primaryColor: 0x9c27b0,
    secondaryColor: 0xce93d8,
    accentColor: 0x66bb6a,
    icon: '🌿',
    backgroundPattern: 'herb',
    nodes: HerbRouteNodes,
    connections: HerbRouteConnections,
    startingNodeId: 'herb_start',
    endingNodeId: 'herb_ending',
    totalLevels: 3,
    requiredStars: 6,
    unlocked: false
  }
};

export const BranchRoutesList: BranchRouteData[] = Object.values(BranchRoutes);

export const Endings: Record<string, EndingData> = {
  flower_ending: {
    id: 'flower_ending',
    routeId: 'flower',
    title: '花之绽放',
    subtitle: '花卉之路圆满完成',
    description: '你已成为花卉专家！',
    longDescription: `恭喜你完成了花卉之路的所有挑战！

在这段芬芳的旅程中，你修复了多种珍贵的花卉标本，从娇艳的玫瑰到灿烂的向日葵，再到高雅的兰花。每一朵花都在你的巧手下重获新生。

作为一名花卉专家，你不仅掌握了标本修复的技艺，更理解了每一朵花背后的故事与意义。它们或象征爱情，或代表希望，或寓意高雅。

愿你在未来的植物考察中，继续发现更多美丽的花卉，将大自然的芬芳传递给更多人。`,
    illustrationKey: 'ending_flower',
    primaryColor: 0xe91e63,
    secondaryColor: 0xff69b4,
    rewards: [
      { type: 'score', id: 104, name: '花卉大师奖励', value: 3000, description: '完成花卉路线的终极奖励' },
      { type: 'badge', id: 204, name: '花卉大师', description: '授予完成花卉之路的植物学家' }
    ],
    badgeId: 204
  },
  tree_ending: {
    id: 'tree_ending',
    routeId: 'tree',
    title: '森林之心',
    subtitle: '森林之路圆满完成',
    description: '你已成为森林守护者！',
    longDescription: `恭喜你完成了森林之路的所有挑战！

在这段深入森林的旅程中，你修复了多种古老的树木标本，从被誉为"活化石"的银杏，到形态各异的多肉植物。每一棵树都在你的巧手下重现生机。

作为一名森林守护者，你不仅掌握了标本修复的技艺，更感受到了树木的坚韧与生命力。它们见证了岁月的流转，承载着大自然的记忆。

愿你在未来的植物考察中，继续探索更多神奇的树木，守护这片绿色的家园。`,
    illustrationKey: 'ending_tree',
    primaryColor: 0x4caf50,
    secondaryColor: 0x81c784,
    rewards: [
      { type: 'score', id: 105, name: '森林守护者奖励', value: 3000, description: '完成森林路线的终极奖励' },
      { type: 'badge', id: 205, name: '森林守护者', description: '授予完成森林之路的植物学家' }
    ],
    badgeId: 205
  },
  herb_ending: {
    id: 'herb_ending',
    routeId: 'herb',
    title: '百草全书',
    subtitle: '香草之路圆满完成',
    description: '你已成为草药大师！',
    longDescription: `恭喜你完成了香草之路的所有挑战！

在这段芬芳的旅程中，你修复了多种珍贵的草本标本，从芬芳的薰衣草到可爱的多肉植物，再到神秘的兰花。每一种草本都在你的巧手下重焕光彩。

作为一名草药大师，你不仅掌握了标本修复的技艺，更了解了各种草本植物的奇妙用途。它们或可入药，或可调味，或可观赏，每一种都有其独特的价值。

愿你在未来的植物考察中，继续发现更多神奇的草本植物，将大自然的馈赠分享给更多人。`,
    illustrationKey: 'ending_herb',
    primaryColor: 0x9c27b0,
    secondaryColor: 0xce93d8,
    rewards: [
      { type: 'score', id: 106, name: '草药大师奖励', value: 3000, description: '完成香草路线的终极奖励' },
      { type: 'badge', id: 206, name: '草药大师', description: '授予完成香草之路的植物学家' }
    ],
    badgeId: 206
  }
};

export function getBranchRoute(routeId: BranchRouteType): BranchRouteData | undefined {
  return BranchRoutes[routeId];
}

export function getMapNode(routeId: BranchRouteType, nodeId: string): MapNodeData | undefined {
  const route = BranchRoutes[routeId];
  if (!route) return undefined;
  return route.nodes.find(node => node.id === nodeId);
}

export function getNextNodes(routeId: BranchRouteType, currentNodeId: string): MapNodeData[] {
  const route = BranchRoutes[routeId];
  if (!route) return [];
  
  const nextNodeIds = route.connections
    .filter(conn => conn.from === currentNodeId)
    .map(conn => conn.to);
  
  return route.nodes.filter(node => nextNodeIds.includes(node.id));
}

export function getPrevNodes(routeId: BranchRouteType, currentNodeId: string): MapNodeData[] {
  const route = BranchRoutes[routeId];
  if (!route) return [];
  
  const prevNodeIds = route.connections
    .filter(conn => conn.to === currentNodeId)
    .map(conn => conn.from);
  
  return route.nodes.filter(node => prevNodeIds.includes(node.id));
}

export function getEnding(endingId: string): EndingData | undefined {
  return Endings[endingId];
}

export function getRouteEnding(routeId: BranchRouteType): EndingData | undefined {
  const endingId = `${routeId}_ending`;
  return Endings[endingId];
}

export function getRouteLevelIds(routeId: BranchRouteType): number[] {
  const route = BranchRoutes[routeId];
  if (!route) return [];
  return route.nodes
    .filter(node => node.type === 'level' || node.type === 'boss')
    .map(node => node.levelId!)
    .filter(id => id !== undefined);
}

export function getRouteByNodeId(nodeId: string): BranchRouteData | undefined {
  return BranchRoutesList.find(route => 
    route.nodes.some(node => node.id === nodeId)
  );
}
