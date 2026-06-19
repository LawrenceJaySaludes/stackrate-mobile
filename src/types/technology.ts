export interface Technology {
  id: number;
  category_id: number;
  name: string;
  description: string;
  difficulty: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface TechnologyWithCategory extends Technology {
  categories: Category | null;
}

export interface UserTechnologyNotes {
  id: string;
  user_id: string;
  technology_id: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryScore {
  categoryName: string;
  average: number;
  rated: number;
  total: number;
}

export interface AnalyticsData {
  overallScore: number;
  totalRated: number;
  totalTechnologies: number;
  categoryScores: CategoryScore[];
}

export interface Role {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface RoleRequirement {
  id: string;
  role_id: string;
  technology_id: number;
  required_score: number;
  technologies?: Technology | null;
}

export interface RoleWithRequirements extends Role {
  requirements: (RoleRequirement & { technologies: Technology })[];
}

export interface SkillGap {
  technologyName: string;
  technologyId: number;
  requiredScore: number;
  userScore: number;
  gap: number;
  status: "missing" | "below" | "met";
}

export interface MatchResult {
  role: RoleWithRequirements;
  matchScore: number;
  skillGaps: SkillGap[];
  missingSkills: SkillGap[];
  belowSkills: SkillGap[];
  recommendations: SkillGap[];
}

export interface CategorySection {
  title: string;
  data: Technology[];
}
