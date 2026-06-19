import { LevelData, GalleryItem } from '../types/GameTypes';
import { LevelRules, getLevelRule } from './LevelRules';
import { PlantSpecimens, getPlantSpecimen } from './PlantSpecimens';
import { getChapterByLevelId } from './Chapters';

export const Levels: LevelData[] = LevelRules.map(rule => {
  const specimen = getPlantSpecimen(rule.specimenId)!;
  return {
    id: rule.id,
    name: rule.name,
    rule: rule,
    specimen: specimen
  };
});

export const GalleryItems: GalleryItem[] = LevelRules.map(rule => {
  const specimen = getPlantSpecimen(rule.specimenId)!;
  const chapter = getChapterByLevelId(rule.id);
  return {
    id: rule.id,
    name: specimen.name, 
    family: specimen.family,
    description: specimen.description,
    specimenId: specimen.id,
    unlocked: false,
    chapterId: chapter?.id ?? 1
  };
});

export function getLevelById(id: number): LevelData | undefined {
  const rule = getLevelRule(id);
  if (!rule) return undefined;
  const specimen = getPlantSpecimen(rule.specimenId);
  if (!specimen) return undefined;
  return {
    id: rule.id,
    name: rule.name,
    rule: rule,
    specimen: specimen
  };
}

export function getGalleryItemById(id: number): GalleryItem | undefined {
  return GalleryItems.find(item => item.id === id);
}
