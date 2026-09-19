/**
 * Safe string & key formatters to handle polymorphic backend objects cleanly.
 */

export const getSkillLabel = (item) => {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item.skill_name === 'string') return item.skill_name;
  if (typeof item.name === 'string') return item.name;
  if (typeof item.title === 'string') return item.title;
  if (item.skill) {
    if (typeof item.skill === 'string') return item.skill;
    if (typeof item.skill.name === 'string') return item.skill.name;
    if (typeof item.skill.title === 'string') return item.skill.title;
  }
  return typeof item === 'object' ? (item.skill_name || item.name || item.title || 'Capability') : String(item);
};

export const getSkillId = (item, fallbackIdx = 0) => {
  if (!item) return `skill-${fallbackIdx}`;
  if (typeof item === 'string' || typeof item === 'number') return `skill-${item}-${fallbackIdx}`;
  if (item.skill_id && typeof item.skill_id !== 'object') return `skill-${item.skill_id}`;
  if (item.id && typeof item.id !== 'object') return `skill-${item.id}`;
  if (item.skill && item.skill.id && typeof item.skill.id !== 'object') return `skill-${item.skill.id}`;
  const label = getSkillLabel(item);
  return `skill-${label}-${fallbackIdx}`;
};

export const getProficiencyLabel = (item, defaultLevel = 'Intermediate') => {
  if (!item || typeof item !== 'object') return defaultLevel;
  return item.required_proficiency || item.minimum_proficiency || item.candidate_proficiency || item.proficiency || defaultLevel;
};

/**
 * Safely extract a department display string from any polymorphic backend shape:
 *   - plain string  →  returned as-is
 *   - {id, name}   →  returns .name or .id
 *   - anything else →  '' (empty — let the caller provide a fallback)
 */
export const getDeptLabel = (dept) => {
  if (!dept) return '';
  if (typeof dept === 'string') return dept;
  if (typeof dept === 'object') return dept.name || dept.id || '';
  return String(dept);
};
