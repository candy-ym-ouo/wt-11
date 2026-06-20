import { LevelData, GalleryItem } from '../types/GameTypes';
import { LevelRules, getLevelRule } from './LevelRules';
import { PlantSpecimens, getPlantSpecimen } from './PlantSpecimens';
import { getChapterByLevelId, isHiddenLevel, getHiddenLevelChapterId } from './Chapters';
import { EventLevelRules, getEventLevelRule } from './EventLevelRules';
import { Events } from './Events';

export const Levels: LevelData[] = LevelRules.map(rule => {
  const specimen = getPlantSpecimen(rule.specimenId)!;
  return {
    id: rule.id,
    name: rule.name,
    rule: rule,
    specimen: specimen
  };
});

export const EventLevels: LevelData[] = EventLevelRules.map(rule => {
  const specimen = getPlantSpecimen(rule.specimenId)!;
  return {
    id: rule.id,
    name: rule.name,
    rule: rule,
    specimen: specimen
  };
});

export const AllLevels: LevelData[] = [...Levels, ...EventLevels];

export const GalleryItems: GalleryItem[] = LevelRules.map(rule => {
  const specimen = getPlantSpecimen(rule.specimenId)!;
  const chapter = getChapterByLevelId(rule.id);
  const hidden = isHiddenLevel(rule.id);
  const hiddenChapterId = getHiddenLevelChapterId(rule.id);
  return {
    id: rule.id,
    name: specimen.name, 
    family: specimen.family,
    description: specimen.description,
    specimenId: specimen.id,
    unlocked: false,
    chapterId: hidden ? (hiddenChapterId ?? 1) : (chapter?.id ?? 1),
    isHiddenLevel: hidden
  };
});

export const EventGalleryItems: GalleryItem[] = EventLevelRules.map(rule => {
  const specimen = getPlantSpecimen(rule.specimenId)!;
  const event = Object.values(Events).find(e => e.id === rule.eventId);
  return {
    id: rule.id,
    name: specimen.name,
    family: specimen.family,
    description: specimen.description,
    specimenId: specimen.id,
    unlocked: false,
    chapterId: event ? 999 : 1,
    isEventExclusive: true,
    eventId: rule.eventId,
    eventName: event?.name
  };
});

export const AllGalleryItems: GalleryItem[] = [...GalleryItems, ...EventGalleryItems];

export function getLevelById(id: number): LevelData | undefined {
  const mainRule = getLevelRule(id);
  if (mainRule) {
    const specimen = getPlantSpecimen(mainRule.specimenId);
    if (specimen) {
      return {
        id: mainRule.id,
        name: mainRule.name,
        rule: mainRule,
        specimen: specimen
      };
    }
  }

  const eventRule = getEventLevelRule(id);
  if (eventRule) {
    const specimen = getPlantSpecimen(eventRule.specimenId);
    if (specimen) {
      return {
        id: eventRule.id,
        name: eventRule.name,
        rule: eventRule,
        specimen: specimen
      };
    }
  }

  return undefined;
}

export function getGalleryItemById(id: number): GalleryItem | undefined {
  return AllGalleryItems.find(item => item.id === id);
}

export function getEventGallerySpecimenIds(): number[] {
  return EventLevelRules.map(r => r.specimenId);
}

