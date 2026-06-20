import Phaser from 'phaser';
import { getPlantSpecimen } from '../data/PlantSpecimens';
import { PlantSpecimen } from '../types/GameTypes';
import { SpecimenTextureGenerator, SPECIMEN_WIDTH, SPECIMEN_HEIGHT } from '../utils/SpecimenTextureGenerator';
import { SaveManager } from '../utils/SaveManager';

interface ShowcaseInitData {
  specimenId: number;
  returnScene?: string;
  returnData?: any;
  levelId?: number;
  specimen?: PlantSpecimen;
  onComplete?: () => void;
}

export class FirstShowcaseScene extends Phaser.Scene {
  private specimenId!: number;
  private specimen!: PlantSpecimen;
  private returnScene?: string;
  private returnData: any = null;
  private levelId: number | null = null;
  private onComplete?: () => void;

  private restoredKey: string = '';
  private damagedKey: string = '';

  constructor() {
    super('FirstShowcaseScene');
  }

  init(data: ShowcaseInitData): void {
    this.specimenId = data.specimenId;
    this.returnScene = data.returnScene;
    this.returnData = data.returnData || null;
    this.levelId = data.levelId ?? null;
    this.onComplete = data.onComplete;

    if (data.specimen) {
      this.specimen = data.specimen;
    } else {
      const specimen = getPlantSpecimen(this.specimenId);
      if (!specimen) {
        if (this.onComplete) {
          this.onComplete();
        } else if (this.returnScene) {
          this.scene.start(this.returnScene, this.returnData);
        }
        return;
      }
      this.specimen = specimen;
    }
  }

  preload(): void {}

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(10, 10, 30, 0.97)');
    this.cameras.main.fadeIn(500, 0, 0, 0);

    const textures = SpecimenTextureGenerator.generateShowcaseTextures(this, this.specimen);
    this.restoredKey = textures.restoredKey;
    this.damagedKey = textures.damagedKey;

    this.addBackgroundDecor();
    this.addTitleSection();
    this.time.delayedCall(350, () => this.addComparisonSection());
    this.time.delayedCall(1400, () => this.addKnowledgeSection());
    this.time.delayedCall(2400, () => this.addFavoriteSection());
    this.time.delayedCall(3200, () => this.addActionButton());
  }

  private addBackgroundDecor(): void {
    const particleColors = [
      this.specimen.primaryColor,
      this.specimen.secondaryColor,
      0xffd700,
      0xffffff
    ];

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, 750);
      const y = Phaser.Math.Between(0, 1334);
      const size = Phaser.Math.Between(3, 10);
      const color = particleColors[Phaser.Math.Between(0, particleColors.length - 1)];
      const alpha = Phaser.Math.FloatBetween(0.1, 0.35);

      const particle = this.add.circle(x, y, size, color, alpha);
      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(60, 200),
        x: x + Phaser.Math.Between(-40, 40),
        alpha: 0,
        scale: { from: 1, to: 0.3 },
        duration: Phaser.Math.Between(3000, 6000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    const ringGlow = this.add.graphics();
    ringGlow.lineStyle(3, this.specimen.primaryColor, 0.12);
    ringGlow.strokeCircle(375, 380, 280);

    this.tweens.add({
      targets: ringGlow,
      scale: { from: 0.9, to: 1.1 },
      alpha: { from: 0.1, to: 0.25 },
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private addTitleSection(): void {
    const badge = this.add.graphics();
    badge.fillStyle(0xff9800, 1);
    badge.fillRoundedRect(375 - 90, 55, 180, 38, 19);

    this.add.text(375, 74, '✨ 首修成就', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const title = this.add.text(375, 125, '首次修复成功！', {
      font: 'bold 42px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: title,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut'
    });

    const nameContainer = this.add.container(375, 182);

    const nameBg = this.add.graphics();
    nameBg.fillStyle(0x0f3460, 0.85);
    nameBg.fillRoundedRect(-190, -30, 380, 60, 16);
    nameBg.lineStyle(2, this.specimen.primaryColor, 0.7);
    nameBg.strokeRoundedRect(-190, -30, 380, 60, 16);
    nameContainer.add(nameBg);

    const plantName = this.add.text(0, 0, `🌿 ${this.specimen.name}`, {
      font: 'bold 28px Arial',
      color: '#' + this.specimen.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);
    nameContainer.add(plantName);

    const familyTag = this.add.text(0, 25, `${this.specimen.family} · ${this.specimen.genus}`, {
      font: '13px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    nameContainer.add(familyTag);

    nameContainer.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: nameContainer,
      alpha: 1,
      scale: 1,
      duration: 450,
      delay: 250,
      ease: 'Back.easeOut'
    });
  }

  private addComparisonSection(): void {
    const sectionY = 300;

    const sectionTitle = this.add.text(375, sectionY, '🔄 修复前后对比', {
      font: 'bold 22px Arial',
      color: '#ffd700'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: sectionTitle,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.easeOut'
    });

    const imgW = 290;
    const imgH = imgW * (SPECIMEN_HEIGHT / SPECIMEN_WIDTH);
    const imgY = sectionY + 40 + imgH / 2;

    const damagedX = 180;
    const restoredX = 570;

    const damagedImg = this.add.image(damagedX, imgY, this.damagedKey)
      .setDisplaySize(imgW, imgH)
      .setAlpha(0)
      .setScale(0.8);

    const damagedFrame = this.add.graphics();
    damagedFrame.lineStyle(4, 0x8b4513, 0.9);
    damagedFrame.strokeRoundedRect(damagedX - imgW / 2 - 5, imgY - imgH / 2 - 5, imgW + 10, imgH + 10, 10);
    damagedFrame.setAlpha(0);

    const damagedLabelBg = this.add.graphics();
    damagedLabelBg.fillStyle(0x5d4037, 0.95);
    damagedLabelBg.fillRoundedRect(damagedX - 65, imgY + imgH / 2 + 10, 130, 32, 8);
    damagedLabelBg.setAlpha(0);

    const damagedLabel = this.add.text(damagedX, imgY + imgH / 2 + 26, '💔 修复前', {
      font: 'bold 15px Arial',
      color: '#ffccbc'
    }).setOrigin(0.5).setAlpha(0);

    const arrowX = 375;
    const arrowY = imgY;

    const arrowGlow = this.add.graphics();
    arrowGlow.fillStyle(0x4caf50, 0);
    arrowGlow.fillCircle(arrowX, arrowY, 40);
    arrowGlow.setAlpha(0);

    const arrow = this.add.text(arrowX, arrowY, '➡️', {
      font: '52px Arial'
    }).setOrigin(0.5).setAlpha(0).setScale(0.5);

    const restoredImg = this.add.image(restoredX, imgY, this.restoredKey)
      .setDisplaySize(imgW, imgH)
      .setAlpha(0)
      .setScale(0.8);

    const restoredFrame = this.add.graphics();
    restoredFrame.lineStyle(4, 0x4caf50, 0.95);
    restoredFrame.strokeRoundedRect(restoredX - imgW / 2 - 5, imgY - imgH / 2 - 5, imgW + 10, imgH + 10, 10);
    restoredFrame.setAlpha(0);

    const sparkleCount = 10;
    const sparkles: Phaser.GameObjects.Graphics[] = [];
    for (let i = 0; i < sparkleCount; i++) {
      const s = this.add.graphics();
      s.fillStyle(0xffd700, 1);
      s.fillCircle(0, 0, 0);
      sparkles.push(s);
    }

    const restoredLabelBg = this.add.graphics();
    restoredLabelBg.fillStyle(0x2e7d32, 0.95);
    restoredLabelBg.fillRoundedRect(restoredX - 65, imgY + imgH / 2 + 10, 130, 32, 8);
    restoredLabelBg.setAlpha(0);

    const restoredLabel = this.add.text(restoredX, imgY + imgH / 2 + 26, '🌱 修复后', {
      font: 'bold 15px Arial',
      color: '#c8e6c9'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [damagedImg, damagedFrame, damagedLabelBg, damagedLabel],
      alpha: 1,
      duration: 400,
      ease: 'Cubic.easeOut'
    });

    this.tweens.add({
      targets: damagedImg,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(400, () => {
      this.tweens.add({
        targets: [arrow, arrowGlow],
        alpha: 1,
        duration: 350,
        ease: 'Cubic.easeOut'
      });
      this.tweens.add({
        targets: arrow,
        scale: 1,
        duration: 350,
        ease: 'Back.easeOut'
      });
      this.tweens.add({
        targets: arrowGlow,
        alpha: { from: 0, to: 0.35 },
        scale: { from: 0.5, to: 1.2 },
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: [restoredImg, restoredFrame, restoredLabelBg, restoredLabel],
        alpha: 1,
        duration: 450,
        ease: 'Cubic.easeOut'
      });
      this.tweens.add({
        targets: restoredImg,
        scale: 1,
        duration: 500,
        ease: 'Back.easeOut'
      });

      this.cameras.main.flash(250, 255, 255, 180);

      sparkles.forEach((s, i) => {
        const angle = (i / sparkleCount) * Math.PI * 2;
        const dist = imgW * 0.55;
        const sx = restoredX + Math.cos(angle) * dist;
        const sy = imgY + Math.sin(angle) * dist;

        s.setPosition(sx, sy);
        s.setAlpha(0);

        this.tweens.add({
          targets: s,
          alpha: [0, 1, 0],
          scale: [0.2, 1.5, 0.3],
          fillStyle: { from: 0xffd700, to: 0xffeb3b },
          duration: 700,
          delay: i * 60,
          ease: 'Cubic.easeOut',
          onStart: () => {
            s.clear();
            s.fillStyle(0xffd700, 1);
            const size = Phaser.Math.Between(3, 7);
            s.fillTriangle(0, -size, -size * 0.5, size * 0.5, size * 0.5, size * 0.5);
            s.fillCircle(0, 0, size * 0.4);
          }
        });
      });

      const shine = this.add.graphics();
      shine.lineStyle(3, 0xffffff, 0);
      shine.strokeRoundedRect(
        restoredX - imgW / 2 - 5,
        imgY - imgH / 2 - 5,
        imgW + 10,
        imgH + 10,
        10
      );

      this.tweens.add({
        targets: shine,
        alpha: [0, 0.8, 0],
        duration: 900,
        delay: 300,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private addKnowledgeSection(): void {
    const sectionY = 680;

    const sectionTitle = this.add.text(375, sectionY, '📚 知识摘要', {
      font: 'bold 22px Arial',
      color: '#4fc3f7'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: sectionTitle,
      alpha: 1,
      duration: 300,
      ease: 'Cubic.easeOut'
    });

    const cardX = 50;
    const cardY = sectionY + 40;
    const cardW = 650;
    const cardH = 270;

    const card = this.add.graphics();
    card.fillStyle(0x0f3460, 0.92);
    card.fillRoundedRect(cardX, cardY, cardW, cardH, 18);
    card.lineStyle(2, 0x4fc3f7, 0.4);
    card.strokeRoundedRect(cardX, cardY, cardW, cardH, 18);
    card.setAlpha(0).setScale(0.9);

    this.tweens.add({
      targets: card,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    const content = [
      {
        icon: '📖',
        label: '学名简介',
        value: `${this.specimen.name}（${this.specimen.aliases.slice(0, 3).join('、')}）`,
        color: '#64b5f6'
      },
      {
        icon: '🌍',
        label: '分布地区',
        value: this.specimen.distribution.slice(0, 4).join('、'),
        color: '#81c784'
      },
      {
        icon: '🏞️',
        label: '生长环境',
        value: this.specimen.habitat.length > 50
          ? this.specimen.habitat.substring(0, 48) + '…'
          : this.specimen.habitat,
        color: '#ffb74d'
      },
      {
        icon: '☀️',
        label: '光照需求',
        value: this.specimen.careKnowledge.light.length > 42
          ? this.specimen.careKnowledge.light.substring(0, 40) + '…'
          : this.specimen.careKnowledge.light,
        color: '#fff176'
      },
      {
        icon: '💧',
        label: '浇水指南',
        value: this.specimen.careKnowledge.water.length > 42
          ? this.specimen.careKnowledge.water.substring(0, 40) + '…'
          : this.specimen.careKnowledge.water,
        color: '#4fc3f7'
      },
      {
        icon: '💡',
        label: '养护小贴士',
        value: this.specimen.careKnowledge.tips.length > 42
          ? this.specimen.careKnowledge.tips.substring(0, 40) + '…'
          : this.specimen.careKnowledge.tips,
        color: '#ba68c8'
      }
    ];

    const itemStartY = cardY + 20;
    const itemH = 40;
    const iconX = cardX + 25;
    const labelX = cardX + 72;
    const valueX = cardX + 175;
    const valueMaxW = cardX + cardW - valueX - 20;

    content.forEach((item, index) => {
      const itemY = itemStartY + index * itemH + 8;

      const icon = this.add.text(iconX, itemY + 8, item.icon, {
        font: '24px Arial'
      }).setOrigin(0, 0.5).setAlpha(0);

      const label = this.add.text(labelX, itemY + 8, item.label, {
        font: 'bold 13px Arial',
        color: item.color
      }).setOrigin(0, 0.5).setAlpha(0);

      const value = this.add.text(valueX, itemY + 8, item.value, {
        font: '13px Arial',
        color: '#d0d0d0',
        wordWrap: { width: valueMaxW }
      }).setOrigin(0, 0.5).setAlpha(0);

      const divider = this.add.graphics();
      if (index < content.length - 1) {
        divider.lineStyle(1, 0xffffff, 0.06);
        divider.beginPath();
        divider.moveTo(cardX + 20, itemY + itemH - 4);
        divider.lineTo(cardX + cardW - 20, itemY + itemH - 4);
        divider.strokePath();
        divider.setAlpha(0);
      }

      this.tweens.add({
        targets: [icon, label, value, divider],
        alpha: 1,
        duration: 280,
        delay: 120 + index * 90,
        ease: 'Cubic.easeOut'
      });
    });
  }

  private addFavoriteSection(): void {
    const sectionY = 990;

    const favCardX = 120;
    const favCardY = sectionY;
    const favCardW = 510;
    const favCardH = 80;

    const favCard = this.add.graphics();
    favCard.fillStyle(0x1a237e, 0.8);
    favCard.fillRoundedRect(favCardX, favCardY, favCardW, favCardH, 16);
    favCard.lineStyle(3, 0xe91e63, 0.85);
    favCard.strokeRoundedRect(favCardX, favCardY, favCardW, favCardH, 16);
    favCard.setAlpha(0).setScale(0.8);

    const heartIcon = this.add.text(favCardX + 40, favCardY + favCardH / 2, '❤️', {
      font: '40px Arial'
    }).setOrigin(0, 0.5).setScale(0);

    const titleText = this.add.text(
      favCardX + 90,
      favCardY + favCardH / 2 - 12,
      '已加入图鉴收藏！',
      {
        font: 'bold 20px Arial',
        color: '#f8bbd0'
      }
    ).setOrigin(0, 0.5).setAlpha(0);

    const subText = this.add.text(
      favCardX + 90,
      favCardY + favCardH / 2 + 14,
      '可在「图鉴」中随时查看详细资料',
      {
        font: '13px Arial',
        color: '#b0bec5'
      }
    ).setOrigin(0, 0.5).setAlpha(0);

    this.tweens.add({
      targets: favCard,
      alpha: 1,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: heartIcon,
        scale: [0, 1.3, 1],
        duration: 650,
        ease: 'Back.easeOut'
      });

      this.tweens.add({
        targets: [titleText, subText],
        alpha: 1,
        duration: 350,
        delay: 200,
        ease: 'Cubic.easeOut'
      });

      const unlockTime = SaveManager.getGalleryUnlockTime(this.specimenId);
      if (unlockTime) {
        const date = new Date(unlockTime);
        const timeText = this.add.text(
          favCardX + favCardW - 20,
          favCardY + favCardH / 2,
          `${date.getMonth() + 1}/${date.getDate()} 收藏`,
          {
            font: '12px Arial',
            color: '#90a4ae'
          }
        ).setOrigin(1, 0.5).setAlpha(0);

        this.tweens.add({
          targets: timeText,
          alpha: 1,
          duration: 300,
          delay: 500
        });
      }
    });

    for (let i = 0; i < 6; i++) {
      const miniHeart = this.add.text(
        favCardX + 40 + Phaser.Math.Between(-10, 10),
        favCardY + favCardH / 2 + Phaser.Math.Between(-10, 10),
        ['💖', '💕', '💗', '💝'][Phaser.Math.Between(0, 3)],
        { font: `${Phaser.Math.Between(16, 28)}px Arial` }
      ).setOrigin(0.5).setAlpha(0).setDepth(10);

      this.tweens.add({
        targets: miniHeart,
        y: miniHeart.y - Phaser.Math.Between(50, 110),
        x: miniHeart.x + Phaser.Math.Between(-50, 50),
        alpha: [0, 1, 0],
        scale: [0.5, 1.2, 0.3],
        duration: Phaser.Math.Between(800, 1400),
        delay: 300 + i * 100,
        ease: 'Cubic.easeOut'
      });
    }
  }

  private addActionButton(): void {
    const btnY = 1130;
    const btnW = 500;
    const btnH = 68;

    const btn = this.add.graphics();
    btn.fillStyle(this.specimen.primaryColor, 1);
    btn.fillRoundedRect(375 - btnW / 2, btnY, btnW, btnH, 18);
    btn.setAlpha(0).setInteractive(
      new Phaser.Geom.Rectangle(375 - btnW / 2, btnY, btnW, btnH),
      Phaser.Geom.Rectangle.Contains
    );

    const btnLabel = this.add.text(375, btnY + btnH / 2, '太棒了！继续探索', {
      font: 'bold 23px Arial',
      color: '#ffffff'
    }).setOrigin(0.5).setAlpha(0);

    const btnShine = this.add.graphics();
    btnShine.fillStyle(0xffffff, 0);
    btnShine.fillRoundedRect(375 - btnW / 2, btnY, btnW, btnH, 18);

    this.tweens.add({
      targets: [btn, btnLabel],
      alpha: 1,
      duration: 350,
      ease: 'Back.easeOut'
    });

    this.tweens.add({
      targets: btn,
      scaleY: { from: 0.5, to: 1 },
      duration: 350,
      ease: 'Back.easeOut'
    });

    const handleExit = () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.time.delayedCall(350, () => {
        if (this.onComplete) {
          this.onComplete();
        } else if (this.returnScene) {
          this.scene.start(this.returnScene, this.returnData);
        }
      });
    };

    btn.on('pointerover', () => {
      btn.clear();
      const lighter = this.lightenColor(this.specimen.primaryColor, 25);
      btn.fillStyle(lighter, 1);
      btn.fillRoundedRect(375 - btnW / 2, btnY, btnW, btnH, 18);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(this.specimen.primaryColor, 1);
      btn.fillRoundedRect(375 - btnW / 2, btnY, btnW, btnH, 18);
    });

    btn.on('pointerdown', () => {
      btn.clear();
      const darker = this.lightenColor(this.specimen.primaryColor, -20);
      btn.fillStyle(darker, 1);
      btn.fillRoundedRect(375 - btnW / 2, btnY, btnW, btnH, 18);
    });

    btn.on('pointerup', () => {
      btn.disableInteractive();
      handleExit();
    });

    const hint = this.add.text(375, btnY + btnH + 35, '点击任意位置或按钮继续', {
      font: '13px Arial',
      color: '#78909c'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: hint,
      alpha: 0.8,
      duration: 400,
      delay: 200
    });

    this.tweens.add({
      targets: hint,
      alpha: { from: 0.4, to: 0.85 },
      duration: 1600,
      delay: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.time.delayedCall(500, () => {
      this.input.once('pointerdown', () => {
        if (btn.input && btn.input.enabled) {
          btn.disableInteractive();
          handleExit();
        }
      });
    });
  }

  private lightenColor(hex: number, amount: number): number {
    const r = Math.min(255, Math.max(0, ((hex >> 16) & 0xff) + amount));
    const g = Math.min(255, Math.max(0, ((hex >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (hex & 0xff) + amount));
    return (r << 16) | (g << 8) | b;
  }
}
