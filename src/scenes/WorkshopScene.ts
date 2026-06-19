import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import {
  Fragments, Materials, WorkshopRecipes,
  getFragmentById, getMaterialById, getRecipeBySpecimenId,
  getRarityColor, getRarityText, getFragmentsBySpecimenId
} from '../data/WorkshopConfig';

type TabKey = 'fragments' | 'materials' | 'recipes';

export class WorkshopScene extends Phaser.Scene {
  private currentTab: TabKey = 'fragments';
  private scrollOffset: number = 0;

  constructor() {
    super('WorkshopScene');
  }

  create(): void {
    this.scrollOffset = 0;
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addTabBar();
    this.addContent();
    this.addBackButton();

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any[], _dx: number, dy: number) => {
      const maxScroll = this.getMaxScroll();
      this.scrollOffset = Phaser.Math.Clamp(this.scrollOffset + dy, 0, maxScroll);
      this.scene.restart();
    });
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');
    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1150, 20);
  }

  private addTitle(): void {
    this.add.text(375, 50, '🔧 标本修复工坊', {
      font: 'bold 38px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 90, '收集碎片与材料，修复珍稀标本', {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 120, 660, 55, 12);

    const totalFragments = Object.values(SaveManager.getAllFragments()).reduce((s, c) => s + c, 0);
    const totalMaterials = Object.values(SaveManager.getAllMaterials()).reduce((s, c) => s + c, 0);
    const restoredCount = SaveManager.getRestoredSpecimens().length;

    this.add.text(110, 147, '🧩', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(140, 147, `碎片: ${totalFragments}`, {
      font: 'bold 16px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(290, 147, '🧪', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(320, 147, `材料: ${totalMaterials}`, {
      font: 'bold 16px Arial',
      color: '#2196f3'
    }).setOrigin(0, 0.5);

    this.add.text(470, 147, '✅', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(500, 147, `已修复: ${restoredCount}/${WorkshopRecipes.length}`, {
      font: 'bold 16px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);
  }

  private addTabBar(): void {
    const tabY = 210;
    const tabW = 200;
    const tabH = 44;
    const spacing = 15;
    const tabs: TabKey[] = ['fragments', 'materials', 'recipes'];
    const labels: Record<TabKey, string> = {
      fragments: '🧩 碎片',
      materials: '🧪 材料',
      recipes: '📜 配方'
    };
    const colors: Record<TabKey, number> = {
      fragments: 0x4caf50,
      materials: 0x2196f3,
      recipes: 0xff9800
    };
    const totalW = tabW * tabs.length + spacing * (tabs.length - 1);
    const startX = (750 - totalW) / 2;

    tabs.forEach((tab, index) => {
      const x = startX + index * (tabW + spacing) + tabW / 2;
      const isSelected = this.currentTab === tab;

      const tabBg = this.add.graphics();
      tabBg.fillStyle(isSelected ? colors[tab] : 0x0f3460, isSelected ? 1 : 0.7);
      tabBg.fillRoundedRect(x - tabW / 2, tabY - tabH / 2, tabW, tabH, 10);

      if (isSelected) {
        tabBg.lineStyle(2, 0xffffff, 0.8);
        tabBg.strokeRoundedRect(x - tabW / 2, tabY - tabH / 2, tabW, tabH, 10);
      }

      this.add.text(x, tabY, labels[tab], {
        font: 'bold 16px Arial',
        color: isSelected ? '#ffffff' : '#aaaaaa'
      }).setOrigin(0.5);

      tabBg.setInteractive(
        new Phaser.Geom.Rectangle(x - tabW / 2, tabY - tabH / 2, tabW, tabH),
        Phaser.Geom.Rectangle.Contains
      );

      tabBg.on('pointerup', () => {
        this.currentTab = tab;
        this.scrollOffset = 0;
        this.scene.restart();
      });
    });
  }

  private addContent(): void {
    const clip = this.add.graphics();
    clip.fillStyle(0x0a0a1a, 0);
    clip.fillRect(35, 250, 680, 950);

    switch (this.currentTab) {
      case 'fragments':
        this.addFragmentContent();
        break;
      case 'materials':
        this.addMaterialContent();
        break;
      case 'recipes':
        this.addRecipeContent();
        break;
    }
  }

  private addFragmentContent(): void {
    const ownedFragments = SaveManager.getAllFragments();
    const ownedIds = Object.keys(ownedFragments).map(Number);

    if (ownedIds.length === 0) {
      this.add.text(375, 600, '暂无碎片', {
        font: '24px Arial',
        color: '#666666'
      }).setOrigin(0.5);
      this.add.text(375, 650, '完成关卡可获得碎片', {
        font: '16px Arial',
        color: '#555555'
      }).setOrigin(0.5);
      return;
    }

    const startY = 280 - this.scrollOffset;
    const cardW = 320;
    const cardH = 110;
    const padding = 15;
    const cols = 2;

    ownedIds.forEach((fragmentId, index) => {
      const fragment = getFragmentById(fragmentId);
      if (!fragment) return;
      const count = ownedFragments[fragmentId];

      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + 25 + col * (cardW + padding) + cardW / 2;
      const y = startY + row * (cardH + padding) + cardH / 2;

      if (y < 200 || y > 1250) return;

      const rarityColor = getRarityColor(fragment.rarity);

      const card = this.add.graphics();
      card.fillStyle(0x0f3460, 0.9);
      card.fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);
      card.lineStyle(2, rarityColor, 0.6);
      card.strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 10);

      const rarityBadge = this.add.graphics();
      rarityBadge.fillStyle(rarityColor, 0.8);
      rarityBadge.fillRoundedRect(x - cardW / 2 + 8, y - cardH / 2 + 8, 50, 22, 6);
      this.add.text(x - cardW / 2 + 33, y - cardH / 2 + 19, getRarityText(fragment.rarity), {
        font: 'bold 11px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      const specimen = getPlantSpecimen(fragment.specimenId);
      this.add.text(x - cardW / 2 + 15, y - 10, fragment.name, {
        font: 'bold 17px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(x - cardW / 2 + 15, y + 15, specimen ? specimen.family : '', {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(x + cardW / 2 - 15, y, `×${count}`, {
        font: 'bold 24px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    });
  }

  private addMaterialContent(): void {
    const ownedMaterials = SaveManager.getAllMaterials();

    const startY = 280 - this.scrollOffset;
    const cardW = 660;
    const cardH = 80;
    const padding = 12;

    Materials.forEach((material, index) => {
      const count = ownedMaterials[material.id] || 0;
      const y = startY + index * (cardH + padding) + cardH / 2;

      if (y < 200 || y > 1250) return;

      const card = this.add.graphics();
      card.fillStyle(count > 0 ? 0x0f3460 : 0x222233, 0.9);
      card.fillRoundedRect(45, y - cardH / 2, cardW, cardH, 10);
      card.lineStyle(2, count > 0 ? 0x2196f3 : 0x333344, 0.6);
      card.strokeRoundedRect(45, y - cardH / 2, cardW, cardH, 10);

      this.add.text(85, y - 12, material.icon, {
        font: '32px Arial'
      }).setOrigin(0, 0.5);

      this.add.text(130, y - 14, material.name, {
        font: 'bold 18px Arial',
        color: count > 0 ? '#ffffff' : '#666666'
      }).setOrigin(0, 0.5);

      this.add.text(130, y + 10, material.description, {
        font: '13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);

      this.add.text(665, y, `×${count}`, {
        font: 'bold 22px Arial',
        color: count > 0 ? '#2196f3' : '#444444'
      }).setOrigin(1, 0.5);
    });
  }

  private addRecipeContent(): void {
    const startY = 280 - this.scrollOffset;
    const cardW = 660;
    const cardH = 280;
    const padding = 20;

    WorkshopRecipes.forEach((recipe, index) => {
      const specimen = getPlantSpecimen(recipe.specimenId);
      if (!specimen) return;

      const isRestored = SaveManager.isSpecimenRestored(recipe.specimenId);
      const canRestore = SaveManager.canRestoreSpecimen(recipe.specimenId);
      const y = startY + index * (cardH + padding) + cardH / 2;

      if (y < 150 || y > 1250) return;

      const card = this.add.graphics();
      card.fillStyle(isRestored ? 0x1a3a1a : 0x0f3460, 0.9);
      card.fillRoundedRect(45, y - cardH / 2, cardW, cardH, 12);
      card.lineStyle(3, isRestored ? 0x4caf50 : canRestore ? 0xff9800 : 0x333355, 0.8);
      card.strokeRoundedRect(45, y - cardH / 2, cardW, cardH, 12);

      const previewKey = `specimen-${specimen.id}-preview`;
      const imgY = y - cardH / 2 + 70;
      if (isRestored || this.textures.exists(previewKey)) {
        const img = this.add.image(115, imgY, previewKey);
        img.setDisplaySize(90, 90);
        if (!isRestored) {
          img.setAlpha(0.4);
          this.add.image(115, imgY, 'lock').setScale(0.8);
        }
      }

      const infoX = 175;
      this.add.text(infoX, y - cardH / 2 + 25, isRestored ? '✅ 已修复' : specimen.name, {
        font: 'bold 20px Arial',
        color: isRestored ? '#4caf50' : '#ffffff'
      }).setOrigin(0, 0.5);

      this.add.text(infoX, y - cardH / 2 + 50, specimen.family, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      const fragY = y - cardH / 2 + 80;
      this.add.text(infoX, fragY, '所需碎片:', {
        font: 'bold 14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      recipe.requiredFragments.forEach((req, fi) => {
        const frag = getFragmentById(req.fragmentId);
        if (!frag) return;
        const owned = SaveManager.getFragmentCount(req.fragmentId);
        const enough = owned >= req.count;
        const fx = infoX + fi * 160;
        const fy = fragY + 25;

        this.add.text(fx, fy, `${frag.name}`, {
          font: '13px Arial',
          color: enough ? '#4caf50' : '#f44336'
        }).setOrigin(0, 0.5);

        this.add.text(fx + 120, fy, `${owned}/${req.count}`, {
          font: 'bold 13px Arial',
          color: enough ? '#4caf50' : '#f44336'
        }).setOrigin(0, 0.5);
      });

      const matY = fragY + 50;
      this.add.text(infoX, matY, '所需材料:', {
        font: 'bold 14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);

      recipe.requiredMaterials.forEach((req, mi) => {
        const mat = getMaterialById(req.materialId);
        if (!mat) return;
        const owned = SaveManager.getMaterialCount(req.materialId);
        const enough = owned >= req.count;
        const mx = infoX + mi * 160;
        const my = matY + 25;

        this.add.text(mx, my, `${mat.icon} ${mat.name}`, {
          font: '13px Arial',
          color: enough ? '#4caf50' : '#f44336'
        }).setOrigin(0, 0.5);

        this.add.text(mx + 120, my, `${owned}/${req.count}`, {
          font: 'bold 13px Arial',
          color: enough ? '#4caf50' : '#f44336'
        }).setOrigin(0, 0.5);
      });

      if (isRestored) {
        const viewBtn = this.add.graphics();
        viewBtn.fillStyle(0x4caf50, 0.8);
        viewBtn.fillRoundedRect(45, y + cardH / 2 - 50, 660, 40, 8);
        viewBtn.setInteractive(
          new Phaser.Geom.Rectangle(45, y + cardH / 2 - 50, 660, 40),
          Phaser.Geom.Rectangle.Contains
        );

        this.add.text(375, y + cardH / 2 - 30, '📚 在图鉴中查看', {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);

        viewBtn.on('pointerup', () => {
          this.scene.start('GalleryScene');
        });
      } else if (canRestore) {
        const restoreBtn = this.add.graphics();
        restoreBtn.fillStyle(0xff9800, 1);
        restoreBtn.fillRoundedRect(45, y + cardH / 2 - 50, 660, 40, 8);
        restoreBtn.setInteractive(
          new Phaser.Geom.Rectangle(45, y + cardH / 2 - 50, 660, 40),
          Phaser.Geom.Rectangle.Contains
        );

        this.add.text(375, y + cardH / 2 - 30, '🔧 开始修复', {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);

        restoreBtn.on('pointerup', () => {
          this.performRestore(recipe.specimenId);
        });
      } else {
        const lockText = this.add.text(375, y + cardH / 2 - 30, '🔒 材料不足', {
          font: '16px Arial',
          color: '#666666'
        }).setOrigin(0.5);
      }
    });
  }

  private performRestore(specimenId: number): void {
    const success = SaveManager.restoreSpecimen(specimenId);
    if (!success) return;

    const specimen = getPlantSpecimen(specimenId);
    if (!specimen) return;

    this.cameras.main.flash(300, 255, 215, 0);

    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(75, 300, 600, 700, 24);
    modal.lineStyle(4, 0x4caf50, 1);
    modal.strokeRoundedRect(75, 300, 600, 700, 24);
    container.add(modal);

    this.add.text(375, 360, '🎉 修复成功！', {
      font: 'bold 36px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    const previewKey = `specimen-${specimenId}-preview`;
    const targetKey = `specimen-${specimenId}-target`;
    const displayKey = this.textures.exists(targetKey) ? targetKey : previewKey;
    const img = this.add.image(375, 530, displayKey);
    img.setDisplaySize(300, 240);
    container.add(img);

    this.add.text(375, 680, specimen.name, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 720, specimen.family, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.add.text(375, 790, specimen.description, {
      font: '16px Arial',
      color: '#eaeaea',
      align: 'center',
      wordWrap: { width: 480 }
    }).setOrigin(0.5);

    const galleryBadge = this.add.graphics();
    galleryBadge.fillStyle(0x4caf50, 1);
    galleryBadge.fillRoundedRect(175, 860, 400, 45, 10);
    container.add(galleryBadge);
    this.add.text(375, 882, '📚 已同步至图鉴', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(0x4caf50, 1);
    confirmBtn.fillRoundedRect(200, 930, 350, 55, 14);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(200, 930, 350, 55),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(confirmBtn);

    this.add.text(375, 957, '继续修复', {
      font: 'bold 22px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      container.destroy();
      this.scene.restart();
    };

    confirmBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1255;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 30, 300, 60, 15);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 150, btnY - 30, 300, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(btnX, btnY, '返回', {
      font: 'bold 24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 30, 300, 60, 15);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 30, 300, 60, 15);
    });

    btn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private getMaxScroll(): number {
    switch (this.currentTab) {
      case 'fragments': {
        const count = Object.keys(SaveManager.getAllFragments()).length;
        const rows = Math.ceil(count / 2);
        return Math.max(0, rows * 125 - 950);
      }
      case 'materials': {
        const rows = Materials.length;
        return Math.max(0, rows * 92 - 950);
      }
      case 'recipes': {
        const rows = WorkshopRecipes.length;
        return Math.max(0, rows * 300 - 950);
      }
      default:
        return 0;
    }
  }
}
