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

export interface CategorySection {
  title: string;
  data: Technology[];
}
