import { QuizQuestion, ChapterQuizConfig } from '../types/GameTypes';

export const QuizQuestions: QuizQuestion[] = [
  // 银杏相关题目 (specimenId: 1)
  {
    id: 'ginkgo-q1',
    specimenId: 1,
    question: '银杏的叶片呈什么形状？',
    options: ['心形', '扇形', '针形', '掌形'],
    correctAnswerIndex: 1,
    explanation: '银杏的叶片呈独特的扇形，顶端有波状缺刻，叶脉从叶柄顶端射出呈二叉状分枝，这在现代植物中极为罕见。',
    difficulty: 'easy',
    category: 'biology'
  },
  {
    id: 'ginkgo-q2',
    specimenId: 1,
    question: '银杏被誉为植物界的什么？',
    options: ['植物界的熊猫', '植物界的金丝猴', '植物界的东北虎', '植物界的丹顶鹤'],
    correctAnswerIndex: 0,
    explanation: '银杏起源于2.7亿年前的二叠纪，在第四纪冰川时期大部分地区灭绝，仅在中国部分地区幸存，因此被誉为"植物界的大熊猫"。',
    difficulty: 'medium',
    category: 'ecology'
  },
  {
    id: 'ginkgo-q3',
    specimenId: 1,
    question: '银杏叶提取物主要用于治疗什么疾病？',
    options: ['糖尿病', '心脑血管疾病', '癌症', '关节炎'],
    correctAnswerIndex: 1,
    explanation: '银杏叶提取物富含黄酮类和萜内酯类化合物，可改善血液循环、保护神经细胞，是治疗心脑血管疾病的常用药材。',
    difficulty: 'hard',
    category: 'usage'
  },
  {
    id: 'ginkgo-q4',
    specimenId: 1,
    question: '山东省莒县浮来山定林寺的古银杏树龄约多少年？',
    options: ['1000年', '2000年', '4000年', '6000年'],
    correctAnswerIndex: 2,
    explanation: '山东省莒县浮来山定林寺的古银杏已有4000多年树龄，相传为周公所植。',
    difficulty: 'hard',
    category: 'culture'
  },

  // 玫瑰相关题目 (specimenId: 2)
  {
    id: 'rose-q1',
    specimenId: 2,
    question: '玫瑰的花由多少层花瓣组成？',
    options: ['单层', '双层', '多层', '无数层'],
    correctAnswerIndex: 2,
    explanation: '玫瑰的花由多层花瓣组成，从外向内逐层排列，形成饱满的杯状花冠。',
    difficulty: 'easy',
    category: 'biology'
  },
  {
    id: 'rose-q2',
    specimenId: 2,
    question: '玫瑰茎干上的刺是什么？',
    options: ['真正的刺', '表皮的突起物', '变态的叶', '变态的茎'],
    correctAnswerIndex: 1,
    explanation: '玫瑰茎干上的尖刺实际上是表皮的突起物，而非真正的刺，这是植物的自我保护机制。',
    difficulty: 'medium',
    category: 'ecology'
  },
  {
    id: 'rose-q3',
    specimenId: 2,
    question: '提取1公斤玫瑰精油约需要多少公斤花瓣？',
    options: ['100-300公斤', '500-1000公斤', '3000-5000公斤', '10000公斤以上'],
    correctAnswerIndex: 2,
    explanation: '约3000-5000公斤玫瑰花瓣才能提取1公斤精油，因此玫瑰精油被誉为"精油之王"。',
    difficulty: 'hard',
    category: 'usage'
  },
  {
    id: 'rose-q4',
    specimenId: 2,
    question: '在古希腊神话中，玫瑰是哪位神的圣花？',
    options: ['智慧女神雅典娜', '爱神阿芙洛狄忒', '天后赫拉', '月亮女神阿尔忒弥斯'],
    correctAnswerIndex: 1,
    explanation: '在古希腊神话中，玫瑰是爱神阿芙洛狄忒的圣花，象征热烈的爱情。',
    difficulty: 'medium',
    category: 'culture'
  },

  // 向日葵相关题目 (specimenId: 3)
  {
    id: 'sunflower-q1',
    specimenId: 3,
    question: '向日葵的"花朵"实际上是由什么组成的？',
    options: ['单朵大花', '十朵小花', '上千朵小花', '无数朵小花'],
    correctAnswerIndex: 2,
    explanation: '向日葵的"花朵"实际上是由上千朵小花组成的头状花序，外围是舌状花，中央是管状花。',
    difficulty: 'easy',
    category: 'biology'
  },
  {
    id: 'sunflower-q2',
    specimenId: 3,
    question: '向日葵花盘会随着太阳转动，这种现象叫做什么？',
    options: ['向光性', '向日性', '向地性', '向水性'],
    correctAnswerIndex: 1,
    explanation: '向日葵的花盘会随着太阳从东向西转动，这种现象称为"向日性"，由茎部两侧的生长速率差异造成。',
    difficulty: 'medium',
    category: 'ecology'
  },
  {
    id: 'sunflower-q3',
    specimenId: 3,
    question: '向日葵小花排列呈什么规律？',
    options: ['等差数列', '等比数列', '斐波那契螺旋', '黄金分割'],
    correctAnswerIndex: 2,
    explanation: '向日葵的小花呈完美的斐波那契螺旋排列，这种排列方式能最大限度地利用空间。',
    difficulty: 'hard',
    category: 'biology'
  },
  {
    id: 'sunflower-q4',
    specimenId: 3,
    question: '哪个帝国将向日葵奉为太阳神的象征？',
    options: ['古罗马帝国', '古埃及帝国', '印加帝国', '阿兹特克帝国'],
    correctAnswerIndex: 2,
    explanation: '印加帝国将向日葵奉为太阳神的象征，其黄金饰品中常有向日葵的图案。',
    difficulty: 'medium',
    category: 'culture'
  },

  // 薰衣草相关题目 (specimenId: 4)
  {
    id: 'lavender-q1',
    specimenId: 4,
    question: '薰衣草属于哪个科？',
    options: ['菊科', '蔷薇科', '唇形科', '兰科'],
    correctAnswerIndex: 2,
    explanation: '薰衣草属于唇形科薰衣草属，其花冠呈二唇形，是唇形科植物的典型特征。',
    difficulty: 'easy',
    category: 'biology'
  },
  {
    id: 'lavender-q2',
    specimenId: 4,
    question: '薰衣草原产于哪里？',
    options: ['亚洲东部', '地中海沿岸', '非洲南部', '美洲中部'],
    correctAnswerIndex: 1,
    explanation: '薰衣草原产于地中海沿岸，喜欢阳光充足、排水良好的环境。',
    difficulty: 'medium',
    category: 'ecology'
  },
  {
    id: 'lavender-q3',
    specimenId: 4,
    question: '薰衣草(Lavender)一词源自拉丁语"Lavare"，原意是什么？',
    options: ['紫色', '芳香', '洗涤', '宁静'],
    correctAnswerIndex: 2,
    explanation: '薰衣草一词源自拉丁语"Lavare"，意为"洗涤"，因为古罗马人常用它来沐浴熏香。',
    difficulty: 'hard',
    category: 'culture'
  },
  {
    id: 'lavender-q4',
    specimenId: 4,
    question: '薰衣草精油最主要的功效是什么？',
    options: ['提神醒脑', '镇静安神', '消炎止痛', '抗菌消毒'],
    correctAnswerIndex: 1,
    explanation: '薰衣草精油具有镇静安神、改善睡眠、缓解焦虑的功效，是最常用的芳香精油之一。',
    difficulty: 'medium',
    category: 'usage'
  },

  // 兰花相关题目 (specimenId: 5)
  {
    id: 'orchid-q1',
    specimenId: 5,
    question: '兰花特有的花结构是什么？',
    options: ['萼片', '花瓣', '唇瓣', '花蕊'],
    correctAnswerIndex: 2,
    explanation: '兰花的一片花瓣特化为唇瓣，形状各异，是吸引特定传粉昆虫的"停机坪"。',
    difficulty: 'easy',
    category: 'biology'
  },
  {
    id: 'orchid-q2',
    specimenId: 5,
    question: '兰花种子萌发需要什么特殊条件？',
    options: ['充足的阳光', '大量的水分', '与特定真菌共生', '高温环境'],
    correctAnswerIndex: 2,
    explanation: '兰花种子极其微小，不含胚乳，在自然条件下必须与特定真菌共生才能萌发。',
    difficulty: 'medium',
    category: 'ecology'
  },
  {
    id: 'orchid-q3',
    specimenId: 5,
    question: '中国兰花与哪三种植物并称"四君子"？',
    options: ['松、竹、梅', '梅、竹、菊', '荷、菊、梅', '松、荷、竹'],
    correctAnswerIndex: 1,
    explanation: '中国兰花与梅、竹、菊并称"四君子"，象征高洁典雅。',
    difficulty: 'medium',
    category: 'culture'
  },
  {
    id: 'orchid-q4',
    specimenId: 5,
    question: '香荚兰(Vanilla)是从什么植物中提取的？',
    options: ['豆科植物', '兰科植物', '藤本植物', '草本植物'],
    correctAnswerIndex: 1,
    explanation: '香荚兰是兰科植物中最重要的经济作物，其豆荚提取物是世界上最受欢迎的食用香料之一。',
    difficulty: 'hard',
    category: 'usage'
  },

  // 多肉植物相关题目 (specimenId: 6)
  {
    id: 'succulent-q1',
    specimenId: 6,
    question: '多肉植物的主要特征是什么？',
    options: ['开花美丽', '叶片或茎肥厚多汁', '生长迅速', '体型高大'],
    correctAnswerIndex: 1,
    explanation: '多肉植物的叶片或茎肥厚多汁，由特殊的储水组织构成，具有极强的耐旱能力。',
    difficulty: 'easy',
    category: 'biology'
  },
  {
    id: 'succulent-q2',
    specimenId: 6,
    question: '多肉植物采用的特殊光合作用途径是什么？',
    options: ['C3途径', 'C4途径', 'CAM途径', '以上都不是'],
    correctAnswerIndex: 2,
    explanation: '多肉植物多采用景天酸代谢(CAM)途径进行光合作用，夜间打开气孔吸收二氧化碳，白天气孔关闭以保水。',
    difficulty: 'hard',
    category: 'ecology'
  },
  {
    id: 'succulent-q3',
    specimenId: 6,
    question: '多肉爱好者社区被称为什么？',
    options: ['肉圈', '肉坑', '肉海', '肉山'],
    correctAnswerIndex: 1,
    explanation: '多肉爱好者社区被称为"肉坑"，形容一旦入坑就难以自拔的喜爱之情。',
    difficulty: 'medium',
    category: 'culture'
  },
  {
    id: 'succulent-q4',
    specimenId: 6,
    question: '芦荟胶状汁液含有多少种以上的活性成分？',
    options: ['25种', '50种', '75种', '100种'],
    correctAnswerIndex: 2,
    explanation: '芦荟的胶状汁液含有75种以上的活性成分，可用于治疗烧伤、促进伤口愈合、滋润皮肤。',
    difficulty: 'hard',
    category: 'usage'
  },

  // 樱花相关题目 (specimenId: 101)
  {
    id: 'sakura-q1',
    specimenId: 101,
    question: '单朵樱花的花期约为多少天？',
    options: ['3天', '7天', '15天', '30天'],
    correctAnswerIndex: 1,
    explanation: '单朵樱花仅开放约7天就会凋谢，整棵树从初开到凋零不过两周。',
    difficulty: 'easy',
    category: 'ecology'
  },
  {
    id: 'sakura-q2',
    specimenId: 101,
    question: '日本延续千年的春日赏樱习俗叫做什么？',
    options: ['花祭', '花见', '花宴', '花舞'],
    correctAnswerIndex: 1,
    explanation: '"花见"（赏花）是日本延续千年的春日习俗，人们在樱花树下设宴聚会。',
    difficulty: 'medium',
    category: 'culture'
  },

  // 睡莲相关题目 (specimenId: 102)
  {
    id: 'waterlily-q1',
    specimenId: 102,
    question: '睡莲的什么特殊结构帮助它在水中生存？',
    options: ['气囊', '通气组织', '气生根', '漂浮根'],
    correctAnswerIndex: 1,
    explanation: '睡莲叶片背面有特殊的通气组织，通过叶柄将空气输送至水下的根系。',
    difficulty: 'medium',
    category: 'biology'
  },
  {
    id: 'waterlily-q2',
    specimenId: 102,
    question: '古埃及壁画中的"莲"实际上是什么植物？',
    options: ['荷花', '睡莲', '莲花', '水葫芦'],
    correctAnswerIndex: 1,
    explanation: '古埃及壁画中的"莲"实际上是睡莲，蓝色睡莲是古埃及的神圣植物。',
    difficulty: 'hard',
    category: 'culture'
  },

  // 彼岸花相关题目 (specimenId: 103)
  {
    id: 'spiderlily-q1',
    specimenId: 103,
    question: '彼岸花最奇特的习性是什么？',
    options: ['夜间开花', '花叶不相见', '只开一次花', '十年开一次花'],
    correctAnswerIndex: 1,
    explanation: '彼岸花有"花叶不相见"的奇特习性：花先叶开放，花谢后叶子才从鳞茎抽出。',
    difficulty: 'easy',
    category: 'ecology'
  },
  {
    id: 'spiderlily-q2',
    specimenId: 103,
    question: '彼岸花在日本被称为什么？',
    options: ['曼陀罗', '曼珠沙华', '优昙婆罗', '钵昙摩'],
    correctAnswerIndex: 1,
    explanation: '彼岸花在日本被称为"曼珠沙华"，是《法华经》中四华之一，传说生长在三途河畔。',
    difficulty: 'medium',
    category: 'culture'
  },

  // 昙花相关题目 (specimenId: 104)
  {
    id: 'epiphyllum-q1',
    specimenId: 104,
    question: '昙花从开放到凋谢约多长时间？',
    options: ['1小时', '4-5小时', '12小时', '24小时'],
    correctAnswerIndex: 1,
    explanation: '昙花从开放到凋谢仅约4-5小时，因此有"昙花一现"之说。',
    difficulty: 'easy',
    category: 'ecology'
  },
  {
    id: 'epiphyllum-q2',
    specimenId: 104,
    question: '昙花为什么选择在夜间开花？',
    options: ['怕光', '适应沙漠环境', '吸引夜间昆虫', '以上都是'],
    correctAnswerIndex: 3,
    explanation: '昙花原产于热带沙漠，白天酷热干燥，夜间凉爽开花可减少水分蒸发，同时吸引夜间活动的蛾类传粉。',
    difficulty: 'hard',
    category: 'ecology'
  },

  // 雪莲相关题目 (specimenId: 105)
  {
    id: 'snowlotus-q1',
    specimenId: 105,
    question: '雪莲通常生长在什么海拔高度？',
    options: ['1000-2000米', '2000-3000米', '3000-5000米', '5000米以上'],
    correctAnswerIndex: 2,
    explanation: '雪莲生长在海拔3000-5000米的高山流石滩，那里紫外线强烈、昼夜温差大。',
    difficulty: 'medium',
    category: 'ecology'
  },
  {
    id: 'snowlotus-q2',
    specimenId: 105,
    question: '雪莲已被列为国家几级保护植物？',
    options: ['一级', '二级', '三级', '未列入'],
    correctAnswerIndex: 1,
    explanation: '由于过度采挖，野生雪莲已濒临灭绝，现已被列为国家二级保护植物。',
    difficulty: 'medium',
    category: 'usage'
  }
];

export const ChapterQuizzes: ChapterQuizConfig[] = [
  {
    chapterId: 1,
    quizId: 'quiz-chapter-1',
    name: '植物入门测验',
    description: '检验你对银杏和玫瑰的了解程度，展示你的植物学基础！',
    requiredSpecimenIds: [1, 2],
    questionIds: ['ginkgo-q1', 'ginkgo-q2', 'rose-q1', 'rose-q2', 'ginkgo-q3', 'rose-q3'],
    passingScore: 60,
    timeLimit: 180,
    rewards: [
      {
        type: 'score',
        id: 301,
        name: '答题奖励',
        description: '完成测验的基础分数奖励',
        value: 800,
        rarity: 'common',
        icon: '⭐'
      },
      {
        type: 'research_point',
        id: 302,
        name: '研究点数',
        description: '可用于加速植物研究的点数',
        value: 50,
        rarity: 'common',
        icon: '🔬'
      },
      {
        type: 'star_bonus',
        id: 303,
        name: '章节星数加成',
        description: '为已完成的关卡增加星星奖励',
        value: 1,
        rarity: 'rare',
        icon: '✨'
      }
    ],
    icon: '📚',
    primaryColor: 0x4caf50,
    secondaryColor: 0x81c784
  },
  {
    chapterId: 2,
    quizId: 'quiz-chapter-2',
    name: '植物多样性测验',
    description: '测试你对向日葵和薰衣草的认识，探索植物世界的多样性！',
    requiredSpecimenIds: [3, 4],
    questionIds: ['sunflower-q1', 'sunflower-q2', 'lavender-q1', 'lavender-q2', 'sunflower-q3', 'lavender-q3', 'sunflower-q4', 'lavender-q4'],
    passingScore: 65,
    timeLimit: 240,
    rewards: [
      {
        type: 'score',
        id: 304,
        name: '答题奖励',
        description: '完成测验的基础分数奖励',
        value: 1200,
        rarity: 'common',
        icon: '⭐'
      },
      {
        type: 'research_point',
        id: 305,
        name: '研究点数',
        description: '可用于加速植物研究的点数',
        value: 80,
        rarity: 'common',
        icon: '🔬'
      },
      {
        type: 'material',
        id: 306,
        name: '高级修复材料',
        description: '用于修复珍贵标本的特殊材料',
        value: 2,
        rarity: 'rare',
        icon: '📦',
        materialId: 2
      },
      {
        type: 'star_bonus',
        id: 307,
        name: '章节星数加成',
        description: '为已完成的关卡增加星星奖励',
        value: 1,
        rarity: 'rare',
        icon: '✨'
      }
    ],
    icon: '🌍',
    primaryColor: 0xff9800,
    secondaryColor: 0xffb74d
  },
  {
    chapterId: 3,
    quizId: 'quiz-chapter-3',
    name: '珍稀植物测验',
    description: '挑战你对兰花和多肉植物的专业知识，证明你是真正的植物学家！',
    requiredSpecimenIds: [5, 6],
    questionIds: ['orchid-q1', 'orchid-q2', 'succulent-q1', 'succulent-q2', 'orchid-q3', 'succulent-q3', 'orchid-q4', 'succulent-q4', 'ginkgo-q4', 'rose-q4'],
    passingScore: 70,
    timeLimit: 300,
    rewards: [
      {
        type: 'score',
        id: 308,
        name: '答题奖励',
        description: '完成测验的基础分数奖励',
        value: 2000,
        rarity: 'common',
        icon: '⭐'
      },
      {
        type: 'research_point',
        id: 309,
        name: '研究点数',
        description: '可用于加速植物研究的点数',
        value: 120,
        rarity: 'rare',
        icon: '🔬'
      },
      {
        type: 'fragment',
        id: 310,
        name: '稀有植物碎片',
        description: '可用于合成稀有植物标本',
        value: 3,
        rarity: 'epic',
        icon: '💎',
        fragmentId: 5
      },
      {
        type: 'badge',
        id: 311,
        name: '百科达人',
        description: '授予完成所有章节测验的植物学家',
        value: 1,
        rarity: 'epic',
        icon: '🏆',
        badgeId: 204
      },
      {
        type: 'star_bonus',
        id: 312,
        name: '章节星数加成',
        description: '为已完成的关卡增加星星奖励',
        value: 2,
        rarity: 'epic',
        icon: '✨'
      }
    ],
    icon: '🎓',
    primaryColor: 0xe94560,
    secondaryColor: 0xff6b8a
  }
];

export function getQuizQuestion(id: string): QuizQuestion | undefined {
  return QuizQuestions.find(q => q.id === id);
}

export function getChapterQuiz(chapterId: number): ChapterQuizConfig | undefined {
  return ChapterQuizzes.find(q => q.chapterId === chapterId);
}

export function getQuizById(quizId: string): ChapterQuizConfig | undefined {
  return ChapterQuizzes.find(q => q.quizId === quizId);
}

export function getQuestionsBySpecimen(specimenId: number): QuizQuestion[] {
  return QuizQuestions.filter(q => q.specimenId === specimenId);
}

export function getQuestionsForQuiz(quizId: string): QuizQuestion[] {
  const quiz = getQuizById(quizId);
  if (!quiz) return [];
  return quiz.questionIds.map(id => getQuizQuestion(id)).filter(Boolean) as QuizQuestion[];
}

export function canAttemptQuiz(quizId: string, unlockedSpecimens: number[]): boolean {
  const quiz = getQuizById(quizId);
  if (!quiz) return false;
  return quiz.requiredSpecimenIds.every(id => unlockedSpecimens.includes(id));
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
