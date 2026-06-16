/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SkillItem {
  name: string;
  category: "Languages" | "Core AI/ML" | "Generative Native" | "Tools & Web";
  level: string; // e.g. "Core Development", "Advanced Concept", "Fluent Practitioner"
  description: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  username: string;
}

export interface ProjectPlaceholder {
  id: string;
  title: string;
  estimatedArrival: string;
  description: string;
  tags: string[];
  techFocus: string;
}
