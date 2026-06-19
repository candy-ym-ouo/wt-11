import Phaser from 'phaser';
import { BranchRoutesList, getMapNode, getRouteEnding } from '../data/BranchRoutes';
import { SaveManager } from '../utils/SaveManager';
import { BranchRouteData, BranchRouteType, MapNodeData, EndingData } from '../types/GameTypes';

export class ChapterMapScene extends Phaser.Scene {
  private currentRouteId: BranchRouteType = 'flower';
  private mapContainer!: Phaser.GameObjects.Container;
  private nodesContainer!: Phaser.GameObjects.Container;
  private connectionsContainer!: Phaser.GameObjects.Container;
  private selectedNodeId: string | null = null;

  constructor() {
    super('ChapterMapScene');
  }

  init(data: { routeId?: BranchRouteType }): void {
    if (data?.routeId) {
      this.currentRouteId = data.routeId;
    } else {
      const activeRoute = SaveManager.getActiveRouteId();
      if (activeRoute) {
        this.currentRouteId = activeRoute;
      }
    }
  }

  create(): void {
    this.addBackground();
    this.addTopBar();
    this.addRouteSelector();
    this.addMapContainer();
    this.addBottomButtons();
    this.renderMap();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 120, 700, 1080, 20);

    const route = BranchRoutesList.find(r => r.id === this.currentRouteId);
    if (route) {
      const decor = this.add.graphics();
      for (let i = 0; i < 12; i++) {
        const x = Phaser.Math.Between(50, 700);
        const y = Phaser.Math.Between(150, 1150);
        const size = Phaser.Math.Between(15, 40);
        decor.fillStyle(route.primaryColor, 0.08);
        decor.fillCircle(x, y, size);
      }
    }
  }

  private addTopBar(): void {
    const route = BranchRoutesList.find(r => r.id === this.currentRouteId);
    if (!route) return;

    this.add.text(375, 50, '植物考察地图', {
      font: 'bold 36px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 85, route.name, {
      font: '24px Arial',
      color: '#' + route.primaryColor.toString(16).padStart(6, '0')
    }).setOrigin(0.5);

    const totalStars = SaveManager.getTotalStars();
    const routeStars = SaveManager.getRouteStars(this.currentRouteId);
    const routeLevels = route.totalLevels;

    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.9);
    statsBg.fillRoundedRect(45, 130, 660, 55, 12);

    this.add.text(70, 157, `⭐ ${routeStars} / ${routeLevels * 3}`, {
      font: 'bold 18px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    const progress = SaveManager.getRouteProgress(this.currentRouteId);
    const completedNodes = progress?.completedNodeIds.length || 0;
    const totalNodes = route.nodes.length;

    this.add.text(300, 157, `进度: ${completedNodes} / ${totalNodes} 节点`, {
      font: '16px Arial',
      color: '#eaeaea'
    }).setOrigin(0, 0.5);

    if (progress?.completed) {
      this.add.text(600, 157, '✓ 已完成', {
        font: 'bold 18px Arial',
        color: '#4caf50'
      }).setOrigin(1, 0.5);
    }
  }

  private addRouteSelector(): void {
    const selectorY = 210;
    const btnWidth = 210;
    const btnHeight = 55;
    const spacing = 15;
    const totalWidth = btnWidth * 3 + spacing * 2;
    const startX = (750 - totalWidth) / 2 + btnWidth / 2;

    BranchRoutesList.forEach((route, index) => {
      const x = startX + index * (btnWidth + spacing);
      const isSelected = route.id === this.currentRouteId;
      const unlocked = SaveManager.isRouteUnlocked(route.id);
      const completed = SaveManager.isRouteCompleted(route.id);

      const btn = this.add.graphics();
      const bgColor = isSelected ? route.primaryColor : (unlocked ? 0x0f3460 : 0x2a2a3a);
      const alpha = unlocked ? 1 : 0.6;

      btn.fillStyle(bgColor, alpha);
      btn.fillRoundedRect(x - btnWidth / 2, selectorY - btnHeight / 2, btnWidth, btnHeight, 12);

      if (isSelected) {
        btn.lineStyle(3, 0xffffff, 0.9);
        btn.strokeRoundedRect(x - btnWidth / 2, selectorY - btnHeight / 2, btnWidth, btnHeight, 12);
      }

      this.add.text(x, selectorY - 8, `${route.icon} ${route.theme}`, {
        font: 'bold 15px Arial',
        color: unlocked ? '#ffffff' : '#666666'
      }).setOrigin(0.5);

      const routeStars = SaveManager.getRouteStars(route.id);
      this.add.text(x, selectorY + 12, `${routeStars}⭐`, {
        font: '12px Arial',
        color: unlocked ? '#ffd700' : '#555555'
      }).setOrigin(0.5);

      if (completed) {
        const badge = this.add.graphics();
        badge.fillStyle(0x4caf50, 1);
        badge.fillCircle(x + btnWidth / 2 - 15, selectorY - btnHeight / 2 + 15, 10);
        this.add.text(x + btnWidth / 2 - 15, selectorY - btnHeight / 2 + 15, '✓', {
          font: 'bold 12px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
      }

      if (!unlocked) {
        this.add.text(x, selectorY + 25, `需要${route.requiredStars}⭐`, {
          font: '11px Arial',
          color: '#ff9800'
        }).setOrigin(0.5);
      }

      if (unlocked) {
        btn.setInteractive(
          new Phaser.Geom.Rectangle(x - btnWidth / 2, selectorY - btnHeight / 2, btnWidth, btnHeight),
          Phaser.Geom.Rectangle.Contains
        );

        btn.on('pointerup', () => {
          if (!isSelected) {
            this.currentRouteId = route.id;
            SaveManager.setActiveRoute(route.id);
            this.scene.restart({ routeId: route.id });
          }
        });

        btn.on('pointerover', () => {
          if (!isSelected) {
            btn.clear();
            btn.fillStyle(this.lighten(bgColor, 20), alpha);
            btn.fillRoundedRect(x - btnWidth / 2, selectorY - btnHeight / 2, btnWidth, btnHeight, 12);
          }
        });

        btn.on('pointerout', () => {
          if (!isSelected) {
            btn.clear();
            btn.fillStyle(bgColor, alpha);
            btn.fillRoundedRect(x - btnWidth / 2, selectorY - btnHeight / 2, btnWidth, btnHeight, 12);
          }
        });
      }
    });
  }

  private addMapContainer(): void {
    this.mapContainer = this.add.container(0, 0);
    
    this.connectionsContainer = this.add.container(0, 0);
    this.nodesContainer = this.add.container(0, 0);
    
    this.mapContainer.add([this.connectionsContainer, this.nodesContainer]);

    const maskGraphics = this.make.graphics();
    maskGraphics.fillRoundedRect(25, 280, 700, 880, 20);
    this.mapContainer.setMask(maskGraphics.createGeometryMask());
  }

  private renderMap(): void {
    const route = BranchRoutesList.find(r => r.id === this.currentRouteId);
    if (!route) return;

    this.connectionsContainer.removeAll(true);
    this.nodesContainer.removeAll(true);

    this.renderConnections(route);
    this.renderNodes(route);
  }

  private renderConnections(route: BranchRouteData): void {
    route.connections.forEach(conn => {
      const fromNode = route.nodes.find(n => n.id === conn.from);
      const toNode = route.nodes.find(n => n.id === conn.to);
      
      if (!fromNode || !toNode) return;

      const isUnlocked = SaveManager.isNodeCompleted(route.id, conn.from);
      const color = isUnlocked ? route.primaryColor : 0x444455;
      const lineWidth = isUnlocked ? 4 : 2;

      const line = this.add.graphics();
      line.lineStyle(lineWidth, color, isUnlocked ? 0.8 : 0.4);
      line.beginPath();
      line.moveTo(fromNode.x, fromNode.y + 280);
      line.lineTo(toNode.x, toNode.y + 280);
      line.strokePath();

      this.connectionsContainer.add(line);
    });
  }

  private renderNodes(route: BranchRouteData): void {
    route.nodes.forEach(node => {
      this.createMapNode(node, route);
    });
  }

  private createMapNode(node: MapNodeData, route: BranchRouteData): void {
    const x = node.x;
    const y = node.y + 280;
    
    const isUnlocked = SaveManager.isNodeUnlocked(route.id, node.id);
    const isCompleted = SaveManager.isNodeCompleted(route.id, node.id);
    const isCurrent = SaveManager.getCurrentNodeId(route.id) === node.id && !isCompleted;

    const nodeSize = this.getNodeSize(node.type);
    const nodeColor = this.getNodeColor(node, route, isCompleted, isUnlocked);

    const nodeBg = this.add.graphics();
    nodeBg.fillStyle(nodeColor.bg, isUnlocked ? 1 : 0.5);
    
    if (node.type === 'story' || node.type === 'reward') {
      nodeBg.fillRoundedRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 12);
    } else {
      nodeBg.fillCircle(x, y, nodeSize / 2);
    }

    if (isCurrent) {
      nodeBg.lineStyle(4, 0xffffff, 1);
      if (node.type === 'story' || node.type === 'reward') {
        nodeBg.strokeRoundedRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 12);
      } else {
        nodeBg.strokeCircle(x, y, nodeSize / 2);
      }

      this.tweens.add({
        targets: nodeBg,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (isCompleted) {
      const checkIcon = this.add.text(x, y, '✓', {
        font: 'bold 24px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.nodesContainer.add(checkIcon);
    } else {
      const iconText = node.icon || this.getNodeDefaultIcon(node.type);
      const icon = this.add.text(x, y, iconText, {
        font: `${nodeSize * 0.5}px Arial`,
        color: isUnlocked ? '#ffffff' : '#666666'
      }).setOrigin(0.5);
      this.nodesContainer.add(icon);
    }

    const labelY = y + nodeSize / 2 + 15;
    const nameLabel = this.add.text(x, labelY, node.name, {
      font: 'bold 14px Arial',
      color: isUnlocked ? '#ffffff' : '#666666'
    }).setOrigin(0.5);
    this.nodesContainer.add(nameLabel);

    if (node.type === 'level' || node.type === 'boss') {
      const starsY = labelY + 18;
      const stars = SaveManager.getProgress(node.levelId!)?.stars || 0;
      
      for (let i = 0; i < 3; i++) {
        const starX = x - 20 + i * 20;
        const starIcon = this.add.text(starX, starsY, i < stars ? '⭐' : '☆', {
          font: '14px Arial',
          color: isUnlocked ? '#ffd700' : '#555555'
        }).setOrigin(0.5);
        this.nodesContainer.add(starIcon);
      }
    }

    if (node.type === 'reward' && isCompleted && SaveManager.canClaimMapNodeRewards(route.id, node.id)) {
      const claimBadge = this.add.graphics();
      claimBadge.fillStyle(0xff9800, 1);
      claimBadge.fillCircle(x + nodeSize / 2 - 5, y - nodeSize / 2 + 5, 12);
      this.nodesContainer.add(claimBadge);

      const claimText = this.add.text(x + nodeSize / 2 - 5, y - nodeSize / 2 + 5, '!', {
        font: 'bold 14px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      this.nodesContainer.add(claimText);
    }

    if (!isUnlocked) {
      const lockIcon = this.add.text(x, y - 5, '🔒', {
        font: '20px Arial'
      }).setOrigin(0.5);
      this.nodesContainer.add(lockIcon);
    }

    this.nodesContainer.add(nodeBg);

    if (isUnlocked) {
      nodeBg.setInteractive(
        new Phaser.Geom.Rectangle(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize),
        Phaser.Geom.Rectangle.Contains
      );

      nodeBg.on('pointerup', () => {
        this.handleNodeClick(node, route);
      });

      nodeBg.on('pointerover', () => {
        nodeBg.clear();
        const lighterColor = this.lighten(nodeColor.bg, 20);
        nodeBg.fillStyle(lighterColor, isUnlocked ? 1 : 0.5);
        if (node.type === 'story' || node.type === 'reward') {
          nodeBg.fillRoundedRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 12);
        } else {
          nodeBg.fillCircle(x, y, nodeSize / 2);
        }
        if (isCurrent) {
          nodeBg.lineStyle(4, 0xffffff, 1);
          if (node.type === 'story' || node.type === 'reward') {
            nodeBg.strokeRoundedRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 12);
          } else {
            nodeBg.strokeCircle(x, y, nodeSize / 2);
          }
        }
      });

      nodeBg.on('pointerout', () => {
        nodeBg.clear();
        nodeBg.fillStyle(nodeColor.bg, isUnlocked ? 1 : 0.5);
        if (node.type === 'story' || node.type === 'reward') {
          nodeBg.fillRoundedRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 12);
        } else {
          nodeBg.fillCircle(x, y, nodeSize / 2);
        }
        if (isCurrent) {
          nodeBg.lineStyle(4, 0xffffff, 1);
          if (node.type === 'story' || node.type === 'reward') {
            nodeBg.strokeRoundedRect(x - nodeSize / 2, y - nodeSize / 2, nodeSize, nodeSize, 12);
          } else {
            nodeBg.strokeCircle(x, y, nodeSize / 2);
          }
        }
      });
    }
  }

  private getNodeSize(type: string): number {
    switch (type) {
      case 'boss': return 70;
      case 'ending': return 80;
      case 'reward': return 55;
      case 'story': return 50;
      default: return 60;
    }
  }

  private getNodeDefaultIcon(type: string): string {
    switch (type) {
      case 'boss': return '👑';
      case 'ending': return '🏆';
      case 'reward': return '🎁';
      case 'story': return '📜';
      default: return '🌱';
    }
  }

  private getNodeColor(node: MapNodeData, route: BranchRouteData, isCompleted: boolean, isUnlocked: boolean): { bg: number } {
    if (!isUnlocked) {
      return { bg: 0x333344 };
    }

    if (isCompleted) {
      return { bg: 0x2e7d32 };
    }

    switch (node.type) {
      case 'boss':
        return { bg: 0xe94560 };
      case 'ending':
        return { bg: 0xffd700 };
      case 'reward':
        return { bg: 0xff9800 };
      case 'story':
        return { bg: 0x9c27b0 };
      default:
        return { bg: route.primaryColor };
    }
  }

  private handleNodeClick(node: MapNodeData, route: BranchRouteData): void {
    switch (node.type) {
      case 'level':
      case 'boss':
        if (node.levelId) {
          this.scene.start('GameScene', { levelId: node.levelId, fromMap: true, nodeId: node.id, routeId: route.id });
        }
        break;
      case 'story':
        this.showStoryDialog(node);
        break;
      case 'reward':
        if (SaveManager.isNodeCompleted(route.id, node.id) && SaveManager.canClaimMapNodeRewards(route.id, node.id)) {
          this.claimNodeReward(node, route);
        } else {
          this.showRewardPreview(node);
        }
        break;
      case 'ending':
        if (SaveManager.isNodeCompleted(route.id, node.id)) {
          this.showEnding(route);
        } else {
          this.showEndingPreview(route);
        }
        break;
    }
  }

  private showStoryDialog(node: MapNodeData): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(50, 350, 650, 500, 20);
    modal.lineStyle(3, 0x9c27b0, 1);
    modal.strokeRoundedRect(50, 350, 650, 500, 20);

    this.add.text(375, 400, `📜 ${node.name}`, {
      font: 'bold 28px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(375, 460, node.description, {
      font: '16px Arial',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);

    const contentBg = this.add.graphics();
    contentBg.fillStyle(0x0f3460, 0.8);
    contentBg.fillRoundedRect(80, 500, 590, 250, 12);

    this.add.text(375, 625, node.storyContent || '', {
      font: '18px Arial',
      color: '#eaeaea',
      align: 'center',
      wordWrap: { width: 550 }
    }).setOrigin(0.5);

    const continueBtn = this.add.graphics();
    continueBtn.fillStyle(0x9c27b0, 1);
    continueBtn.fillRoundedRect(225, 770, 300, 60, 14);
    continueBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 770, 300, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 800, '继续探索', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      if (!SaveManager.isNodeCompleted(this.currentRouteId, node.id)) {
        SaveManager.completeNode(this.currentRouteId, node.id);
        this.renderMap();
      }
      overlay.destroy();
      modal.destroy();
      contentBg.destroy();
      continueBtn.destroy();
    };

    continueBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private showRewardPreview(node: MapNodeData): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 400, 630, 400, 20);
    modal.lineStyle(3, 0xff9800, 1);
    modal.strokeRoundedRect(60, 400, 630, 400, 20);

    this.add.text(375, 450, `🎁 ${node.name}`, {
      font: 'bold 26px Arial',
      color: '#ff9800'
    }).setOrigin(0.5);

    this.add.text(375, 490, node.description, {
      font: '16px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    if (node.rewards) {
      this.add.text(375, 540, '完成奖励：', {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      node.rewards.forEach((reward, index) => {
        const rewardY = 580 + index * 60;
        const rewardBg = this.add.graphics();
        rewardBg.fillStyle(0x0f3460, 0.8);
        rewardBg.fillRoundedRect(100, rewardY, 550, 50, 10);

        let icon = '🎁';
        let valueText = '';
        switch (reward.type) {
          case 'score':
            icon = '💰';
            valueText = `+${reward.value} 分`;
            break;
          case 'badge':
            icon = '🏅';
            valueText = '徽章';
            break;
        }

        this.add.text(130, rewardY + 25, icon, { font: '24px Arial' }).setOrigin(0, 0.5);
        this.add.text(170, rewardY + 25, reward.name, {
          font: 'bold 16px Arial',
          color: '#ffffff'
        }).setOrigin(0, 0.5);
        this.add.text(620, rewardY + 25, valueText, {
          font: 'bold 16px Arial',
          color: '#ffd700'
        }).setOrigin(1, 0.5);
      });
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0x555566, 1);
    closeBtn.fillRoundedRect(225, 720, 300, 55, 12);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 720, 300, 55),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 747, '关闭', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      overlay.destroy();
      modal.destroy();
      closeBtn.destroy();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private claimNodeReward(node: MapNodeData, route: BranchRouteData): void {
    const rewards = SaveManager.claimMapNodeRewards(route.id, node.id);
    if (rewards.length === 0) return;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 350, 630, 500, 20);
    modal.lineStyle(4, route.primaryColor, 1);
    modal.strokeRoundedRect(60, 350, 630, 500, 20);

    this.add.text(375, 400, '🎉 获得奖励！', {
      font: 'bold 30px Arial',
      color: '#4caf50'
    }).setOrigin(0.5);

    this.add.text(375, 440, node.name, {
      font: '20px Arial',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    rewards.forEach((reward, index) => {
      const rewardY = 500 + index * 80;
      const rewardBg = this.add.graphics();
      rewardBg.fillStyle(0x0f3460, 0.8);
      rewardBg.fillRoundedRect(100, rewardY, 550, 65, 12);

      let icon = '🎁';
      let valueText = '';
      switch (reward.type) {
        case 'score':
          icon = '💰';
          valueText = `+${reward.value?.toLocaleString()} 分`;
          break;
        case 'badge':
          icon = '🏅';
          valueText = '徽章解锁';
          break;
      }

      this.add.text(140, rewardY + 32, icon, { font: '30px Arial' }).setOrigin(0, 0.5);
      this.add.text(200, rewardY + 20, reward.name, {
        font: 'bold 18px Arial',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      this.add.text(200, rewardY + 42, reward.description, {
        font: '14px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      this.add.text(620, rewardY + 32, valueText, {
        font: 'bold 18px Arial',
        color: '#ffd700'
      }).setOrigin(1, 0.5);
    });

    const confirmBtn = this.add.graphics();
    confirmBtn.fillStyle(route.primaryColor, 1);
    confirmBtn.fillRoundedRect(225, 780, 300, 60, 14);
    confirmBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 780, 300, 60),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 810, '太棒了！', {
      font: 'bold 20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      overlay.destroy();
      modal.destroy();
      confirmBtn.destroy();
      this.renderMap();
    };

    confirmBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private showEnding(route: BranchRouteData): void {
    const ending = getRouteEnding(route.id);
    if (!ending) return;

    this.scene.start('EndingScene', { endingId: ending.id, routeId: route.id });
  }

  private showEndingPreview(route: BranchRouteData): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(60, 400, 630, 400, 20);
    modal.lineStyle(3, 0xffd700, 1);
    modal.strokeRoundedRect(60, 400, 630, 400, 20);

    this.add.text(375, 450, `🏆 ${route.name}结局`, {
      font: 'bold 26px Arial',
      color: '#ffd700'
    }).setOrigin(0.5);

    this.add.text(375, 500, '完成所有关卡后解锁专属结局', {
      font: '18px Arial',
      color: '#aaaaaa',
      align: 'center'
    }).setOrigin(0.5);

    this.add.text(375, 560, '🔒', {
      font: '60px Arial'
    }).setOrigin(0.5);

    const progress = SaveManager.getRouteProgress(route.id);
    const completedLevels = progress?.completedNodeIds.filter(id => {
      const node = getMapNode(route.id, id);
      return node?.type === 'level' || node?.type === 'boss';
    }).length || 0;

    this.add.text(375, 640, `进度: ${completedLevels} / ${route.totalLevels} 关卡`, {
      font: '18px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(0x555566, 1);
    closeBtn.fillRoundedRect(225, 700, 300, 55, 12);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(225, 700, 300, 55),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(375, 727, '继续努力', {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    const close = () => {
      overlay.destroy();
      modal.destroy();
      closeBtn.destroy();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private addBottomButtons(): void {
    const btnY = 1250;
    const btnW = 220;
    const btnH = 65;
    const spacing = 15;

    const backBtn = this.createBottomButton(
      375 - btnW - spacing,
      btnY,
      btnW,
      btnH,
      '📖 章节',
      0x9c27b0,
      () => this.scene.start('ChapterSelectScene')
    );

    const galleryBtn = this.createBottomButton(
      375,
      btnY,
      btnW,
      btnH,
      '📚 图鉴',
      0x4caf50,
      () => this.scene.start('GalleryScene')
    );

    const menuBtn = this.createBottomButton(
      375 + btnW + spacing,
      btnY,
      btnW,
      btnH,
      '🏠 主菜单',
      0x03a9f4,
      () => this.scene.start('ChapterSelectScene')
    );
  }

  private createBottomButton(
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    color: number,
    onClick: () => void
  ): Phaser.GameObjects.Graphics {
    const btn = this.add.graphics();
    btn.fillStyle(color, 1);
    btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);

    btn.setInteractive(
      new Phaser.Geom.Rectangle(x - w / 2, y - h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(x, y, label, {
      font: 'bold 18px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(this.lighten(color, 20), 1);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(color, 1);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    });

    btn.on('pointerup', onClick);

    return btn;
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
