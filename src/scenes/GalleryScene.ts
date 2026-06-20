import Phaser from 'phaser';
import { AllGalleryItems, EventGalleryItems } from '../data/Levels';
import { SaveManager } from '../utils/SaveManager';
import { GalleryItem, BranchRouteType } from '../types/GameTypes';
import { Chapters, getChapterById } from '../data/Chapters';
import { getActiveEvent } from '../data/Events';
import { getGalleryModifiedDescription } from '../data/ConservationConfig';
import { BranchRoutesList, getBranchRoute } from '../data/BranchRoutes';
import { PlantFamilies, getPlantFamilyBySpecimenId } from '../data/PlantFamilies';
import { getPlantSpecimen } from '../data/PlantSpecimens';

type FilterMode = 'all' | 'chapter' | 'event' | 'route' | 'family';
type UnlockSource = 'main_level' | 'event' | 'workshop' | 'route';

export class GalleryScene extends Phaser.Scene {
  private selectedChapterId: number | null = null;
  private selectedRouteId: BranchRouteType | null = null;
  private selectedFamilyId: string | null = null;
  private filterMode: FilterMode = 'all';
  private searchQuery: string = '';
  private searchInputRect: Phaser.Geom.Rectangle | null = null;
  private isSearchFocused: boolean = false;
  private searchTextObj: Phaser.GameObjects.Text | null = null;
  private searchCursor: Phaser.GameObjects.Text | null = null;
  private galleryContainer: Phaser.GameObjects.Container | null = null;
  private cursorTimer: Phaser.Time.TimerEvent | null = null;

  constructor() {
    super('GalleryScene');
  }

  create(): void {
    this.addBackground();
    this.addTitle();
    this.addStatsBar();
    this.addSearchBar();
    this.addFilterTabs();
    this.addGalleryItems();
    this.addBackButton();
    this.setupKeyboardInput();
  }

  private addBackground(): void {
    this.cameras.main.setBackgroundColor('#1a1a2e');

    const bg = this.add.graphics();
    bg.fillStyle(0x16213e, 1);
    bg.fillRoundedRect(25, 100, 700, 1200, 20);
  }

  private addTitle(): void {
    this.add.text(375, 60, '植物标本修复', {
      font: 'bold 42px Arial',
      color: '#e94560'
    }).setOrigin(0.5);

    this.add.text(375, 100, '植物图鉴', {
      font: '28px Arial',
      color: '#eaeaea'
    }).setOrigin(0.5);
  }

  private addStatsBar(): void {
    const statsBg = this.add.graphics();
    statsBg.fillStyle(0x0f3460, 0.8);
    statsBg.fillRoundedRect(45, 130, 660, 60, 12);

    const unlockedCount = SaveManager.getUnlockedGalleryItems().length;
    const totalCount = AllGalleryItems.length;
    const totalStars = SaveManager.getTotalStars();
    const eventUnlocked = SaveManager.getUnlockedEventGalleryItems().length;
    const eventTotal = EventGalleryItems.length;
    const familiesCompleted = SaveManager.getTotalFamiliesCompleted();
    const totalFamilies = PlantFamilies.length;

    this.add.text(65, 160, '📚', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(95, 160, `${unlockedCount}/${totalCount}`, {
      font: 'bold 14px Arial',
      color: '#4caf50'
    }).setOrigin(0, 0.5);

    this.add.text(195, 160, '⭐', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(225, 160, `${totalStars}`, {
      font: 'bold 14px Arial',
      color: '#ffd700'
    }).setOrigin(0, 0.5);

    this.add.text(305, 160, '🌸', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(335, 160, `${eventUnlocked}/${eventTotal}`, {
      font: 'bold 14px Arial',
      color: '#e91e63'
    }).setOrigin(0, 0.5);

    this.add.text(435, 160, '🏛️', { font: '22px Arial' }).setOrigin(0, 0.5);
    this.add.text(465, 160, `${familiesCompleted}/${totalFamilies}`, {
      font: 'bold 14px Arial',
      color: '#2196f3'
    }).setOrigin(0, 0.5);
  }

  private addSearchBar(): void {
    const barX = 45;
    const barY = 210;
    const barWidth = 660;
    const barHeight = 48;

    const searchBg = this.add.graphics();
    searchBg.fillStyle(0x0a1929, 1);
    searchBg.fillRoundedRect(barX, barY, barWidth, barHeight, 12);
    searchBg.lineStyle(2, 0x3a506b, 1);
    searchBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 12);

    this.add.text(barX + 20, barY + barHeight / 2, '🔍', {
      font: '20px Arial'
    }).setOrigin(0, 0.5);

    this.searchTextObj = this.add.text(barX + 55, barY + barHeight / 2, '搜索植物名称、科、属...', {
      font: '16px Arial',
      color: '#666666'
    }).setOrigin(0, 0.5);

    this.searchCursor = this.add.text(barX + 55, barY + barHeight / 2, '|', {
      font: '18px Arial',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    this.searchCursor.setVisible(false);

    this.searchInputRect = new Phaser.Geom.Rectangle(barX, barY, barWidth, barHeight);

    searchBg.setInteractive(this.searchInputRect, Phaser.Geom.Rectangle.Contains);
    searchBg.on('pointerup', () => {
      this.focusSearch();
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.searchInputRect && !this.searchInputRect.contains(pointer.x, pointer.y)) {
        this.blurSearch();
      }
    });

    const clearBtn = this.add.graphics();
    clearBtn.fillStyle(0x3a506b, 0.8);
    clearBtn.fillCircle(barX + barWidth - 25, barY + barHeight / 2, 14);
    clearBtn.setInteractive(
      new Phaser.Geom.Circle(barX + barWidth - 25, barY + barHeight / 2, 14),
      Phaser.Geom.Circle.Contains
    );
    clearBtn.on('pointerup', () => {
      this.searchQuery = '';
      this.updateSearchDisplay();
      this.refreshGallery();
    });

    this.add.text(barX + barWidth - 25, barY + barHeight / 2, '✕', {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.cursorTimer = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        if (this.isSearchFocused && this.searchCursor) {
          this.searchCursor.setVisible(!this.searchCursor.visible);
        }
      }
    });
  }

  private focusSearch(): void {
    this.isSearchFocused = true;
    if (this.searchTextObj) {
      this.searchTextObj.setColor('#ffffff');
      if (this.searchQuery === '') {
        this.searchTextObj.setText('');
      }
    }
    if (this.searchCursor) {
      this.searchCursor.setVisible(true);
    }
  }

  private blurSearch(): void {
    this.isSearchFocused = false;
    if (this.searchTextObj) {
      if (this.searchQuery === '') {
        this.searchTextObj.setText('搜索植物名称、科、属...');
        this.searchTextObj.setColor('#666666');
      } else {
        this.searchTextObj.setColor('#ffffff');
      }
    }
    if (this.searchCursor) {
      this.searchCursor.setVisible(false);
    }
  }

  private setupKeyboardInput(): void {
    this.input.keyboard!.on('keydown', (event: KeyboardEvent) => {
      if (!this.isSearchFocused) return;

      if (event.key === 'Backspace') {
        this.searchQuery = this.searchQuery.slice(0, -1);
      } else if (event.key === 'Escape') {
        this.searchQuery = '';
        this.blurSearch();
      } else if (event.key === 'Enter') {
        this.blurSearch();
      } else if (event.key.length === 1 && this.searchQuery.length < 20) {
        this.searchQuery += event.key;
      }

      this.updateSearchDisplay();
      this.refreshGallery();
    });
  }

  private updateSearchDisplay(): void {
    if (this.searchTextObj && this.searchCursor) {
      const displayText = this.searchQuery || (this.isSearchFocused ? '' : '搜索植物名称、科、属...');
      this.searchTextObj.setText(displayText);
      this.searchTextObj.setColor(this.searchQuery || this.isSearchFocused ? '#ffffff' : '#666666');

      const barX = 45;
      const barY = 210;
      const textWidth = this.searchTextObj.width;
      this.searchCursor.setPosition(barX + 55 + textWidth + 2, barY + 24);
    }
  }

  private addFilterTabs(): void {
    const tabY = 278;
    const tabWidth = 90;
    const tabHeight = 40;
    const spacing = 5;

    const uniqueFamilies = this.getUniqueFamilies();
    const familyTabs = uniqueFamilies.length;
    const chapterTabs = Chapters.length;
    const routeTabs = BranchRoutesList.length;
    const extraTabs = 2;
    const totalTabs = extraTabs + routeTabs + chapterTabs + familyTabs;
    const totalWidth = tabWidth * totalTabs + spacing * (totalTabs - 1);
    const startX = (750 - totalWidth) / 2 + tabWidth / 2;

    let currentOffset = 0;

    this.createFilterTab(
      startX + currentOffset * (tabWidth + spacing),
      tabY,
      tabWidth,
      tabHeight,
      '全部',
      this.filterMode === 'all',
      0x607d8b,
      () => {
        this.filterMode = 'all';
        this.selectedChapterId = null;
        this.selectedRouteId = null;
        this.selectedFamilyId = null;
        this.refreshGallery();
      }
    );
    currentOffset++;

    const activeEvent = getActiveEvent();
    const eventColor = activeEvent ? activeEvent.primaryColor : 0xe91e63;
    const eventUnlockedCount = SaveManager.getUnlockedEventGalleryItems().length;
    const hasEventItems = EventGalleryItems.length > 0;

    this.createFilterTab(
      startX + currentOffset * (tabWidth + spacing),
      tabY,
      tabWidth,
      tabHeight,
      hasEventItems ? `🌸 活动` : '🌸 活动',
      this.filterMode === 'event',
      eventColor,
      () => {
        this.filterMode = 'event';
        this.selectedChapterId = null;
        this.selectedRouteId = null;
        this.selectedFamilyId = null;
        this.refreshGallery();
      },
      !hasEventItems
    );

    if (hasEventItems && eventUnlockedCount > 0) {
      const badge = this.add.graphics();
      badge.fillStyle(0xffeb3b, 1);
      const badgeX = startX + currentOffset * (tabWidth + spacing) + tabWidth / 2 - 8;
      const badgeY = tabY - tabHeight / 2 + 5;
      badge.fillCircle(badgeX, badgeY, 12);
      this.add.text(badgeX, badgeY, eventUnlockedCount.toString(), {
        font: 'bold 11px Arial',
        color: '#1a1a2e'
      }).setOrigin(0.5);
    }
    currentOffset++;

    BranchRoutesList.forEach((route, index) => {
      const x = startX + (index + currentOffset) * (tabWidth + spacing);
      const isSelected = this.filterMode === 'route' && this.selectedRouteId === route.id;
      const unlocked = SaveManager.isRouteUnlocked(route.id);

      this.createFilterTab(
        x,
        tabY,
        tabWidth,
        tabHeight,
        `${route.icon} ${route.theme}`,
        isSelected,
        route.primaryColor,
        () => {
          if (unlocked) {
            this.filterMode = 'route';
            this.selectedRouteId = route.id;
            this.selectedChapterId = null;
            this.selectedFamilyId = null;
            this.refreshGallery();
          }
        },
        !unlocked
      );
    });
    currentOffset += routeTabs;

    Chapters.forEach((chapter, index) => {
      const x = startX + (index + currentOffset) * (tabWidth + spacing);
      const isSelected = this.filterMode === 'chapter' && this.selectedChapterId === chapter.id;
      const unlocked = SaveManager.isChapterUnlocked(chapter.id);

      this.createFilterTab(
        x,
        tabY,
        tabWidth,
        tabHeight,
        chapter.theme,
        isSelected,
        chapter.primaryColor,
        () => {
          if (unlocked) {
            this.filterMode = 'chapter';
            this.selectedChapterId = chapter.id;
            this.selectedRouteId = null;
            this.selectedFamilyId = null;
            this.refreshGallery();
          }
        },
        !unlocked
      );
    });
    currentOffset += chapterTabs;

    uniqueFamilies.forEach((family, index) => {
      const x = startX + (index + currentOffset) * (tabWidth + spacing);
      const isSelected = this.filterMode === 'family' && this.selectedFamilyId === family.id;
      const familyProgress = SaveManager.getFamilyProgressPercent(family.id);
      const hasUnlocked = familyProgress > 0;

      this.createFilterTab(
        x,
        tabY,
        tabWidth,
        tabHeight,
        `${family.icon} ${family.familyName.replace('科', '')}`,
        isSelected,
        family.primaryColor,
        () => {
          this.filterMode = 'family';
          this.selectedFamilyId = family.id;
          this.selectedChapterId = null;
          this.selectedRouteId = null;
          this.refreshGallery();
        },
        false
      );

      if (hasUnlocked && familyProgress < 100) {
        const progressBadge = this.add.graphics();
        progressBadge.fillStyle(family.primaryColor, 1);
        const badgeX = x + tabWidth / 2 - 10;
        const badgeY = tabY - tabHeight / 2 + 5;
        progressBadge.fillCircle(badgeX, badgeY, 12);
        this.add.text(badgeX, badgeY, `${familyProgress}%`, {
          font: 'bold 9px Arial',
          color: '#ffffff'
        }).setOrigin(0.5);
      } else if (familyProgress === 100) {
        const progressBadge = this.add.graphics();
        progressBadge.fillStyle(0xffd700, 1);
        const badgeX = x + tabWidth / 2 - 10;
        const badgeY = tabY - tabHeight / 2 + 5;
        progressBadge.fillCircle(badgeX, badgeY, 12);
        this.add.text(badgeX, badgeY, '✓', {
          font: 'bold 12px Arial',
          color: '#1a1a2e'
        }).setOrigin(0.5);
      }
    });
  }

  private getUniqueFamilies(): typeof PlantFamilies {
    const seen = new Set<string>();
    return PlantFamilies.filter(f => {
      const key = f.familyName;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private createFilterTab(
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isSelected: boolean,
    color: number,
    onClick: () => void,
    disabled: boolean = false
  ): void {
    const tab = this.add.graphics();
    tab.fillStyle(isSelected ? color : disabled ? 0x2a2a3a : 0x0f3460, disabled ? 0.5 : 1);
    tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);

    if (isSelected) {
      tab.lineStyle(2, 0xffffff, 0.8);
      tab.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
    }

    this.add.text(x, y, label, {
      font: 'bold 12px Arial',
      color: isSelected ? '#ffffff' : disabled ? '#555555' : '#aaaaaa'
    }).setOrigin(0.5);

    if (!disabled) {
      tab.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      tab.on('pointerover', () => {
        if (!isSelected) {
          tab.clear();
          tab.fillStyle(this.lighten(isSelected ? color : 0x0f3460, 15), 1);
          tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        }
      });

      tab.on('pointerout', () => {
        tab.clear();
        tab.fillStyle(isSelected ? color : 0x0f3460, 1);
        tab.fillRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        if (isSelected) {
          tab.lineStyle(2, 0xffffff, 0.8);
          tab.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 8);
        }
      });

      tab.on('pointerup', onClick);
    }
  }

  private getFilteredItems(): GalleryItem[] {
    let itemsToShow: GalleryItem[];
    
    if (this.filterMode === 'event') {
      itemsToShow = EventGalleryItems;
    } else if (this.filterMode === 'route' && this.selectedRouteId !== null) {
      itemsToShow = AllGalleryItems.filter(item => 
        item.routeId === this.selectedRouteId && !item.isEventExclusive
      );
    } else if (this.filterMode === 'chapter' && this.selectedChapterId !== null) {
      itemsToShow = AllGalleryItems.filter(item => 
        item.chapterId === this.selectedChapterId && !item.isEventExclusive
      );
    } else if (this.filterMode === 'family' && this.selectedFamilyId !== null) {
      const selectedFamily = PlantFamilies.find(f => f.id === this.selectedFamilyId);
      if (selectedFamily) {
        const familyName = selectedFamily.familyName;
        itemsToShow = AllGalleryItems.filter(item => {
          const specimen = getPlantSpecimen(item.specimenId);
          return specimen?.family === familyName;
        });
      } else {
        itemsToShow = AllGalleryItems;
      }
    } else {
      itemsToShow = AllGalleryItems;
    }

    if (this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      itemsToShow = itemsToShow.filter(item => {
        const specimen = getPlantSpecimen(item.specimenId);
        const name = specimen?.name?.toLowerCase() || '';
        const family = specimen?.family?.toLowerCase() || '';
        const genus = specimen?.genus?.toLowerCase() || '';
        const itemName = item.name.toLowerCase();
        const itemFamily = item.family.toLowerCase();
        
        return name.includes(query) || 
               family.includes(query) || 
               genus.includes(query) ||
               itemName.includes(query) ||
               itemFamily.includes(query);
      });
    }

    return itemsToShow;
  }

  private refreshGallery(): void {
    if (this.galleryContainer) {
      this.galleryContainer.destroy();
      this.galleryContainer = null;
    }
    this.addGalleryItems();
  }

  private addGalleryItems(): void {
    this.galleryContainer = this.add.container(0, 0);
    const itemsToShow = this.getFilteredItems();

    const startY = 340;
    const itemWidth = 320;
    const itemHeight = 340;
    const padding = 20;
    const cols = 2;

    itemsToShow.forEach((item, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = padding + col * (itemWidth + padding) + itemWidth / 2;
      const y = startY + row * (itemHeight + padding) + itemHeight / 2;

      this.createGalleryItem(x, y, itemWidth, itemHeight, item, this.galleryContainer!);
    });

    if (itemsToShow.length === 0) {
      let emptyText = '暂无图鉴';
      if (this.searchQuery.trim() !== '') {
        emptyText = `未找到与 "${this.searchQuery}" 相关的植物`;
      } else if (this.filterMode === 'event') {
        emptyText = '暂无活动限定图鉴';
      }
      
      const emptyBg = this.add.graphics();
      emptyBg.fillStyle(0x0f3460, 0.6);
      emptyBg.fillRoundedRect(125, 450, 500, 120, 15);
      this.galleryContainer.add(emptyBg);
      
      const emptyIcon = this.add.text(375, 490, '🔍', {
        font: '36px Arial'
      }).setOrigin(0.5);
      this.galleryContainer.add(emptyIcon);
      
      const emptyMsg = this.add.text(375, 540, emptyText, {
        font: '18px Arial',
        color: '#888888'
      }).setOrigin(0.5);
      this.galleryContainer.add(emptyMsg);
    }

    const filteredCount = itemsToShow.length;
    const totalCount = AllGalleryItems.length;
    const unlockedInFilter = itemsToShow.filter(i => SaveManager.isGalleryUnlocked(i.specimenId)).length;
    
    const countBg = this.add.graphics();
    countBg.fillStyle(0x0f3460, 0.8);
    const countY = startY + Math.ceil(filteredCount / cols) * (itemHeight + padding) + 20;
    countBg.fillRoundedRect(45, countY, 660, 35, 10);
    this.galleryContainer.add(countBg);

    const countText = this.add.text(375, countY + 17.5, 
      this.searchQuery 
        ? `搜索结果: ${filteredCount} 种 (已解锁 ${unlockedInFilter})` 
        : `共 ${totalCount} 种植物，当前显示 ${filteredCount} 种 (已解锁 ${unlockedInFilter})`, 
      {
        font: '13px Arial',
        color: '#888888'
      }
    ).setOrigin(0.5);
    this.galleryContainer.add(countText);
  }

  private getUnlockSource(item: GalleryItem): { source: UnlockSource; text: string; icon: string } {
    if (item.isEventExclusive) {
      return { source: 'event', text: item.eventName || '活动限定', icon: '🌸' };
    }
    if (item.routeId) {
      const route = getBranchRoute(item.routeId);
      if (route) {
        return { source: 'route', text: `${route.theme}路线`, icon: route.icon };
      }
    }
    if (SaveManager.isSpecimenRestored(item.specimenId)) {
      return { source: 'workshop', text: '工坊修复', icon: '🔧' };
    }
    const chapter = getChapterById(item.chapterId);
    return { 
      source: 'main_level', 
      text: chapter ? `${chapter.theme}` : '主线关卡', 
      icon: '🎮' 
    };
  }

  private createGalleryItem(
    x: number,
    y: number,
    width: number,
    height: number,
    item: GalleryItem,
    container: Phaser.GameObjects.Container
  ): void {
    const progress = SaveManager.getProgress(item.id);
    const unlocked = SaveManager.isGalleryUnlocked(item.specimenId);
    const chapter = getChapterById(item.chapterId);
    const route = item.routeId ? getBranchRoute(item.routeId) : null;
    const isEvent = item.isEventExclusive;
    const specimen = getPlantSpecimen(item.specimenId);
    const family = getPlantFamilyBySpecimenId(item.specimenId);
    const unlockSource = this.getUnlockSource(item);
    const levelCompleted = progress?.completed ?? false;
    const levelUnlocked = SaveManager.isLevelUnlocked(item.id) || item.isEventExclusive;

    const card = this.add.graphics();
    card.fillStyle(unlocked ? 0x0f3460 : 0x1a1a2e, 1);
    
    const borderColor = isEvent 
      ? (unlocked ? 0xe91e63 : 0x662244) 
      : route
        ? (unlocked ? route.primaryColor : 0x555566)
        : (unlocked ? 0x4caf50 : 0x555566);
    
    card.lineStyle(unlocked ? 2 : 1, borderColor, unlocked ? 1 : 0.5);
    card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
    container.add(card);

    if (!unlocked) {
      const pattern = this.add.graphics();
      for (let px = x - width / 2 + 10; px < x + width / 2 - 10; px += 8) {
        for (let py = y - height / 2 + 10; py < y + height / 2 - 10; py += 8) {
          pattern.fillStyle(0x2a2a3a, 0.3);
          pattern.fillRect(px, py, 4, 4);
        }
      }
      container.add(pattern);
    }

    const badgeBg = this.add.graphics();
    let badgeColor = 0x607d8b;
    let badgeText = '主线';
    let badgeWidth = 75;
    let badgeTextX = 47;
    
    if (isEvent) {
      badgeColor = 0xe91e63;
      badgeText = `🌸 ${item.eventName || '活动限定'}`;
      badgeWidth = 110;
      badgeTextX = 65;
    } else if (route) {
      badgeColor = route.primaryColor;
      badgeText = `${route.icon} ${route.name}`;
      badgeWidth = 95;
      badgeTextX = 57;
    } else if (chapter) {
      badgeColor = chapter.primaryColor;
      badgeText = chapter.theme;
      badgeWidth = 75;
      badgeTextX = 47;
    }
    
    badgeBg.fillStyle(badgeColor, unlocked ? 0.85 : 0.4);
    badgeBg.fillRoundedRect(x - width / 2 + 10, y - height / 2 + 10, badgeWidth, 26, 6);
    container.add(badgeBg);

    const badgeLabel = this.add.text(x - width / 2 + badgeTextX, y - height / 2 + 23, badgeText, {
      font: 'bold 10px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(badgeLabel);

    if (unlocked && family) {
      const familyBadge = this.add.graphics();
      familyBadge.fillStyle(family.primaryColor, 0.7);
      familyBadge.fillRoundedRect(x + width / 2 - 85, y - height / 2 + 10, 75, 26, 6);
      container.add(familyBadge);
      
      const familyLabel = this.add.text(x + width / 2 - 47, y - height / 2 + 23, `${family.icon} ${family.genusName}`, {
        font: 'bold 10px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(familyLabel);
    }

    const previewKey = `specimen-${item.specimenId}-preview`;
    const targetKey = `specimen-${item.specimenId}-target`;
    const imageY = y - 60;

    if (unlocked) {
      const img = this.add.image(x, imageY, previewKey);
      img.setDisplaySize(140, 140);
      container.add(img);
      
      if (isEvent) {
        const cornerBadge = this.add.graphics();
        cornerBadge.fillStyle(0xffd700, 1);
        cornerBadge.fillCircle(x + width / 2 - 15, y - height / 2 + 60, 16);
        container.add(cornerBadge);
        
        const cornerStar = this.add.text(x + width / 2 - 15, y - height / 2 + 60, '★', {
          font: 'bold 18px Arial',
          color: '#1a1a2e'
        }).setOrigin(0.5);
        container.add(cornerStar);
      }
    } else {
      const lockContainer = this.add.container(x, imageY);
      
      const silhouette = this.add.graphics();
      silhouette.fillStyle(0x333344, 0.8);
      silhouette.fillCircle(0, 0, 60);
      lockContainer.add(silhouette);

      const lockImg = this.add.image(0, 0, 'lock').setScale(0.8);
      lockContainer.add(lockImg);
      
      const hintText = specimen?.family ? specimen.family : '???';
      const familyHint = this.add.text(0, 55, hintText, {
        font: '12px Arial',
        color: '#666666'
      }).setOrigin(0.5);
      lockContainer.add(familyHint);
      
      container.add(lockContainer);
    }

    const nameText = this.add.text(x, y + 30, unlocked ? item.name : '??? 未知植物', {
      font: 'bold 20px Arial',
      color: unlocked ? '#ffffff' : '#666666'
    }).setOrigin(0.5);
    container.add(nameText);

    if (unlocked && specimen) {
      const familyText = this.add.text(x, y + 55, `${specimen.family} ${specimen.genus}`, {
        font: '13px Arial',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      container.add(familyText);
    } else if (!unlocked) {
      const unlockHint = this.add.text(x, y + 55, '完成对应关卡解锁', {
        font: '12px Arial',
        color: '#666666'
      }).setOrigin(0.5);
      container.add(unlockHint);
    }

    const sourceY = y + 78;
    const sourceInfo = this.getUnlockSource(item);
    
    const sourceBg = this.add.graphics();
    if (unlocked) {
      sourceBg.fillStyle(0x1a3a5c, 0.8);
    } else {
      sourceBg.fillStyle(0x2a2a3a, 0.8);
    }
    sourceBg.fillRoundedRect(x - width / 2 + 15, sourceY - 12, width - 30, 24, 6);
    container.add(sourceBg);
    
    const sourceLabel = unlocked 
      ? `✅ ${sourceInfo.icon} ${sourceInfo.text}` 
      : `🔒 ${sourceInfo.icon} ${sourceInfo.text}`;
    
    const sourceText = this.add.text(x, sourceY, sourceLabel, {
      font: '11px Arial',
      color: unlocked ? '#81c784' : '#888888'
    }).setOrigin(0.5);
    container.add(sourceText);

    if (unlocked && progress) {
      this.drawStarsInContainer(container, x, y + 115, progress.stars, 18);

      const statsText = `🏆 ${progress.bestScore.toLocaleString()}${levelCompleted ? ' · ✓已通关' : ''}`;
      const statsDisplay = this.add.text(x, y + 140, statsText, {
        font: '12px Arial',
        color: '#ffd700'
      }).setOrigin(0.5);
      container.add(statsDisplay);
    } else if (unlocked && isEvent && !progress) {
      const eventHint = this.add.text(x, y + 115, '✨ 活动奖励解锁', {
        font: '13px Arial',
        color: '#ff80ab'
      }).setOrigin(0.5);
      container.add(eventHint);
    } else if (!unlocked) {
      const statusY = y + 115;
      let statusText = '';
      let statusColor = '#888888';
      
      if (levelUnlocked && !item.isEventExclusive) {
        statusText = '🎯 关卡已解锁，挑战可获得';
        statusColor = '#ffb74d';
      } else if (!levelUnlocked && !item.isEventExclusive) {
        statusText = '🔒 需先解锁对应关卡';
        statusColor = '#888888';
      } else if (item.isEventExclusive) {
        statusText = '🎁 参与活动积分解锁';
        statusColor = '#f48fb1';
      }
      
      if (statusText) {
        const statusDisplay = this.add.text(x, statusY, statusText, {
          font: '11px Arial',
          color: statusColor
        }).setOrigin(0.5);
        container.add(statusDisplay);
      }
    }

    if (unlocked) {
      card.setInteractive(
        new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
        Phaser.Geom.Rectangle.Contains
      );

      card.on('pointerup', () => {
        this.showDetail(item, targetKey);
      });

      card.on('pointerover', () => {
        card.clear();
        card.fillStyle(this.lighten(unlocked ? 0x0f3460 : 0x1a1a2e, 10), 1);
        card.lineStyle(unlocked ? 3 : 1, this.lighten(borderColor, 20), 1);
        card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
        card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
      });

      card.on('pointerout', () => {
        card.clear();
        card.fillStyle(unlocked ? 0x0f3460 : 0x1a1a2e, 1);
        card.lineStyle(unlocked ? 2 : 1, borderColor, unlocked ? 1 : 0.5);
        card.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 12);
        card.fillRoundedRect(x - width / 2, y - height / 2, width, height, 12);
      });
    }
  }

  private drawStarsInContainer(
    container: Phaser.GameObjects.Container, 
    x: number, 
    y: number, 
    stars: number, 
    size: number
  ): void {
    const spacing = 5;
    const startX = x - size - spacing;

    for (let i = 0; i < 3; i++) {
      const starX = startX + i * (size + spacing);
      const texture = i < stars ? 'star-filled' : 'star-empty';
      const star = this.add.image(starX, y, texture).setDisplaySize(size, size);
      container.add(star);
    }
  }

  private showDetail(item: GalleryItem, targetKey: string): void {
    const container = this.add.container(0, 0);

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 750, 1334);
    overlay.setInteractive();
    container.add(overlay);

    const isEvent = item.isEventExclusive;
    const route = item.routeId ? getBranchRoute(item.routeId) : null;
    const specimen = getPlantSpecimen(item.specimenId);
    const family = getPlantFamilyBySpecimenId(item.specimenId);
    const progress = SaveManager.getProgress(item.id);
    const unlockSource = this.getUnlockSource(item);
    const unlockTime = SaveManager.getGalleryUnlockTime(item.specimenId);
    
    let headerColor = 0xe94560;
    if (isEvent) {
      headerColor = 0xe91e63;
    } else if (route) {
      headerColor = route.primaryColor;
    } else if (family) {
      headerColor = family.primaryColor;
    }

    const modal = this.add.graphics();
    modal.fillStyle(0x16213e, 1);
    modal.fillRoundedRect(50, 120, 650, 1100, 20);
    modal.lineStyle(3, headerColor, 1);
    modal.strokeRoundedRect(50, 120, 650, 1100, 20);
    container.add(modal);

    const img = this.add.image(375, 300, targetKey);
    img.setDisplaySize(320, 256);
    container.add(img);

    const typeBadgeContainer = this.add.container(0, 0);
    if (isEvent) {
      const eventBadge = this.add.graphics();
      eventBadge.fillStyle(0xe91e63, 0.95);
      eventBadge.fillRoundedRect(200, 140, 350, 36, 18);
      this.add.text(375, 158, `🌸 ${item.eventName || '活动限定'} 专属图鉴`, {
        font: 'bold 15px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      typeBadgeContainer.add(eventBadge);
    } else if (route) {
      const routeBadge = this.add.graphics();
      routeBadge.fillStyle(route.primaryColor, 0.95);
      routeBadge.fillRoundedRect(200, 140, 350, 36, 18);
      this.add.text(375, 158, `${route.icon} ${route.name} 专属图鉴`, {
        font: 'bold 15px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      typeBadgeContainer.add(routeBadge);
    }
    container.add(typeBadgeContainer);

    const nameText = this.add.text(375, 450, item.name, {
      font: 'bold 32px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);
    container.add(nameText);

    if (specimen) {
      const familyText = this.add.text(375, 485, `${specimen.family} · ${specimen.genus}`, {
        font: '16px Arial',
        color: '#aaaaaa'
      }).setOrigin(0.5);
      container.add(familyText);
    }

    if (specimen?.aliases && specimen.aliases.length > 0) {
      const aliasBg = this.add.graphics();
      aliasBg.fillStyle(0x1a3a5c, 0.6);
      aliasBg.fillRoundedRect(100, 505, 550, 32, 8);
      this.add.text(120, 521, `别名: ${specimen.aliases.join('、')}`, {
        font: '13px Arial',
        color: '#90caf9'
      }).setOrigin(0, 0.5);
      container.add(aliasBg);
    }

    if (family) {
      const familyTagBg = this.add.graphics();
      familyTagBg.fillStyle(family.primaryColor, 0.3);
      familyTagBg.lineStyle(1, family.primaryColor, 0.6);
      familyTagBg.fillRoundedRect(175, 548, 400, 30, 8);
      familyTagBg.strokeRoundedRect(175, 548, 400, 30, 8);
      this.add.text(375, 563, `${family.icon} ${family.familyName} ${family.genusName}`, {
        font: 'bold 13px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);
      container.add(familyTagBg);
    }

    const unlockInfoBg = this.add.graphics();
    unlockInfoBg.fillStyle(0x1a3a5c, 0.8);
    unlockInfoBg.lineStyle(1, headerColor, 0.4);
    unlockInfoBg.fillRoundedRect(100, 590, 550, 75, 10);
    unlockInfoBg.strokeRoundedRect(100, 590, 550, 75, 10);
    
    const sourceIcon = unlockSource.icon;
    const sourceText = unlockSource.text;
    let unlockDetail = '';
    
    if (unlockSource.source === 'main_level') {
      const chapter = getChapterById(item.chapterId);
      unlockDetail = chapter ? `第${chapter.id}章 · ${chapter.name}` : '主线关卡';
    } else if (unlockSource.source === 'route' && route) {
      unlockDetail = `${route.name}`;
    } else if (unlockSource.source === 'event') {
      unlockDetail = '活动积分奖励解锁';
    } else if (unlockSource.source === 'workshop') {
      unlockDetail = '工坊合成修复解锁';
    }

    const levelProgress = SaveManager.getProgress(item.id);
    const levelUnlocked = SaveManager.isLevelUnlocked(item.id);
    let progressText = '';
    if (levelProgress?.completed) {
      progressText = '✅ 已通关';
    } else if (levelUnlocked && !item.isEventExclusive) {
      progressText = '🎯 关卡已解锁';
    } else if (!item.isEventExclusive) {
      progressText = '🔒 关卡未解锁';
    }

    this.add.text(130, 610, `${sourceIcon} 解锁来源`, {
      font: 'bold 12px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);
    this.add.text(130, 632, `${sourceText}${unlockDetail ? ' · ' + unlockDetail : ''}`, {
      font: '13px Arial',
      color: '#81c784'
    }).setOrigin(0, 0.5);
    
    if (progressText) {
      this.add.text(630, 610, progressText, {
        font: 'bold 12px Arial',
        color: levelProgress?.completed ? '#4caf50' : levelUnlocked ? '#ffb74d' : '#888888'
      }).setOrigin(1, 0.5);
    }

    let dateDisplay = '';
    let dateColor = '#90caf9';
    if (unlockTime) {
      const unlockDate = new Date(unlockTime);
      dateDisplay = `${unlockDate.getFullYear()}-${(unlockDate.getMonth() + 1).toString().padStart(2, '0')}-${unlockDate.getDate().toString().padStart(2, '0')}`;
    } else {
      dateDisplay = '早期收藏';
      dateColor = '#bdbdbd';
    }
    this.add.text(630, 632, `📅 ${dateDisplay}`, {
      font: '12px Arial',
      color: dateColor
    }).setOrigin(1, 0.5);
    container.add(unlockInfoBg);

    let displayDescription = item.description;
    const conservationHealth = SaveManager.getConservationHealth(item.specimenId);
    if (conservationHealth > 0 && conservationHealth < 100) {
      displayDescription = getGalleryModifiedDescription(item.description, conservationHealth);
    }

    const descLabel = this.add.text(100, 678, '📖 植物介绍', {
      font: 'bold 13px Arial',
      color: '#888888'
    }).setOrigin(0, 0.5);
    container.add(descLabel);

    const descBg = this.add.graphics();
    descBg.fillStyle(0x0f3460, 0.6);
    descBg.fillRoundedRect(100, 690, 550, 90, 10);
    container.add(descBg);

    const descText = this.add.text(375, 735, displayDescription, {
      font: '14px Arial',
      color: '#eaeaea',
      align: 'center',
      wordWrap: { width: 500 }
    }).setOrigin(0.5);
    container.add(descText);

    if (specimen?.distribution && specimen.distribution.length > 0) {
      const distLabel = this.add.text(100, 795, '🌍 分布区域', {
        font: 'bold 13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      container.add(distLabel);

      const distBg = this.add.graphics();
      distBg.fillStyle(0x0f3460, 0.6);
      distBg.fillRoundedRect(100, 807, 550, 38, 10);
      container.add(distBg);

      const distText = this.add.text(130, 826, specimen.distribution.join(' · '), {
        font: '13px Arial',
        color: '#90caf9',
        wordWrap: { width: 490 }
      }).setOrigin(0, 0.5);
      container.add(distText);
    }

    if (specimen?.habitat) {
      const habitatLabel = this.add.text(100, 858, '🏞️ 生长环境', {
        font: 'bold 13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      container.add(habitatLabel);

      const habitatBg = this.add.graphics();
      habitatBg.fillStyle(0x0f3460, 0.6);
      habitatBg.fillRoundedRect(100, 870, 550, 40, 10);
      container.add(habitatBg);

      const habitatText = this.add.text(375, 890, specimen.habitat, {
        font: '13px Arial',
        color: '#a5d6a7',
        align: 'center',
        wordWrap: { width: 500 }
      }).setOrigin(0.5);
      container.add(habitatText);
    }

    if (specimen?.careKnowledge) {
      const careLabel = this.add.text(100, 923, '🌱 养护知识', {
        font: 'bold 13px Arial',
        color: '#888888'
      }).setOrigin(0, 0.5);
      container.add(careLabel);

      const careBg = this.add.graphics();
      careBg.fillStyle(0x1b5e20, 0.2);
      careBg.lineStyle(1, 0x4caf50, 0.3);
      careBg.fillRoundedRect(100, 935, 550, 150, 10);
      careBg.strokeRoundedRect(100, 935, 550, 150, 10);
      container.add(careBg);

      const careItems = [
        { icon: '☀️', label: '光照', value: specimen.careKnowledge.light },
        { icon: '💧', label: '浇水', value: specimen.careKnowledge.water },
        { icon: '🌡️', label: '温度', value: specimen.careKnowledge.temperature },
        { icon: '🪴', label: '土壤', value: specimen.careKnowledge.soil },
        { icon: '🧪', label: '施肥', value: specimen.careKnowledge.fertilizer }
      ];

      let careY = 952;
      careItems.forEach(item => {
        this.add.text(125, careY, `${item.icon} ${item.label}:`, {
          font: 'bold 12px Arial',
          color: '#81c784'
        }).setOrigin(0, 0.5);
        this.add.text(210, careY, item.value, {
          font: '11px Arial',
          color: '#cccccc',
          wordWrap: { width: 420 }
        }).setOrigin(0, 0.5);
        careY += 22;
      });

      if (specimen.careKnowledge.tips) {
        this.add.text(125, careY + 4, `💡 小贴士: ${specimen.careKnowledge.tips}`, {
          font: '11px Arial',
          color: '#ffd54f',
          wordWrap: { width: 500 }
        }).setOrigin(0, 0.5);
      }
    }

    if (family) {
      const familyDescBg = this.add.graphics();
      familyDescBg.fillStyle(family.primaryColor, 0.1);
      familyDescBg.lineStyle(1, family.primaryColor, 0.3);
      familyDescBg.fillRoundedRect(100, 1095, 550, 50, 10);
      familyDescBg.strokeRoundedRect(100, 1095, 550, 50, 10);
      
      this.add.text(130, 1110, `${family.icon} 科属特征`, {
        font: 'bold 12px Arial',
        color: '#aaaaaa'
      }).setOrigin(0, 0.5);
      
      this.add.text(375, 1128, family.featureDescription, {
        font: '11px Arial',
        color: '#cccccc',
        align: 'center',
        wordWrap: { width: 490 }
      }).setOrigin(0.5);
      container.add(familyDescBg);
    }

    if (isEvent) {
      const eventTagBg = this.add.graphics();
      eventTagBg.fillStyle(0x2d0a1a, 0.8);
      eventTagBg.lineStyle(1, 0xe91e63, 0.5);
      eventTagBg.fillRoundedRect(150, 1155, 450, 32, 10);
      eventTagBg.strokeRoundedRect(150, 1155, 450, 32, 10);
      this.add.text(375, 1171, '✨ 通过活动奖励获得的限定标本', {
        font: '13px Arial',
        color: '#ff80ab'
      }).setOrigin(0.5);
      container.add(eventTagBg);
    }

    const closeBtn = this.add.graphics();
    closeBtn.fillStyle(headerColor, 1);
    const closeBtnY = 1195;
    closeBtn.fillRoundedRect(175, closeBtnY, 180, 45, 12);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(175, closeBtnY, 180, 45),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(closeBtn);

    this.add.text(265, closeBtnY + 22, '关闭', {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    if (!isEvent) {
      const playBtn = this.add.graphics();
      const canPlay = SaveManager.isLevelUnlocked(item.id);
      playBtn.fillStyle(canPlay ? 0x4caf50 : 0x555555, 1);
      playBtn.fillRoundedRect(395, closeBtnY, 180, 45, 12);
      if (canPlay) {
        playBtn.setInteractive(
          new Phaser.Geom.Rectangle(395, closeBtnY, 180, 45),
          Phaser.Geom.Rectangle.Contains
        );
      }
      container.add(playBtn);

      this.add.text(485, closeBtnY + 22, canPlay ? '🎮 挑战关卡' : '🔒 未解锁', {
        font: 'bold 15px Arial',
        color: '#ffffff'
      }).setOrigin(0.5);

      if (canPlay) {
        playBtn.on('pointerup', () => {
          container.destroy();
          this.scene.start('GameScene', { levelId: item.id });
        });
      }
    }

    const logBtn = this.add.graphics();
    logBtn.fillStyle(0x2196f3, 1);
    const logBtnY = closeBtnY + 55;
    logBtn.fillRoundedRect(100, logBtnY, 550, 40, 12);
    logBtn.setInteractive(
      new Phaser.Geom.Rectangle(100, logBtnY, 550, 40),
      Phaser.Geom.Rectangle.Contains
    );
    container.add(logBtn);

    this.add.text(375, logBtnY + 20, '📋 查看修复日志', {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    logBtn.on('pointerup', () => {
      container.destroy();
      this.scene.start('RepairLogScene', { specimenId: item.specimenId });
    });

    const close = () => {
      container.destroy();
    };

    closeBtn.on('pointerup', close);
    overlay.on('pointerup', close);
  }

  private addBackButton(): void {
    const btnX = 375;
    const btnY = 1270;

    const btn = this.add.graphics();
    btn.fillStyle(0xe94560, 1);
    btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    btn.setInteractive(
      new Phaser.Geom.Rectangle(btnX - 150, btnY - 35, 300, 70),
      Phaser.Geom.Rectangle.Contains
    );

    this.add.text(btnX, btnY, '返回', {
      font: 'bold 26px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    btn.on('pointerover', () => {
      btn.clear();
      btn.fillStyle(0xff6b8a, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerout', () => {
      btn.clear();
      btn.fillStyle(0xe94560, 1);
      btn.fillRoundedRect(btnX - 150, btnY - 35, 300, 70, 15);
    });

    btn.on('pointerup', () => {
      this.scene.start('ChapterSelectScene');
    });
  }

  private lighten(hex: number, amount: number): number {
    const r = Math.min(255, ((hex >> 16) & 0xff) + amount);
    const g = Math.min(255, ((hex >> 8) & 0xff) + amount);
    const b = Math.min(255, (hex & 0xff) + amount);
    return (r << 16) | (g << 8) | b;
  }
}
