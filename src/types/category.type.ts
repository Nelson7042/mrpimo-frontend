
export default interface ICategory {
    _id?: string;
    name: string;
    slug: string;
    description?: string;
    parent?: Partial<ICategory>;
    level: number;
    path: string[];
    children?: ICategory[];
    attributes: {
      name: string;
      type: "text" | "number" | "boolean" | "select";
      required: boolean;
      options?: string[];
    }[];
    image?: string;
    productDimensionsRequired?: boolean;
    productWeightRequired?: boolean;
    isActive: boolean;
    createdBy: string;
    updatedBy: string;
    metadata?: Record<string, any>;
  }


  export interface CategoryAttribute {
  _id: string;
  id?: string; // In case both _id and id are used
  name: string;
  type: "text" | "number" | "select" | string; // extendable
  required: boolean;
  options: string[]; // Assuming options are string values for select types
}

export interface Category {
  id: string;
  _id?: string; // Sometimes both are present
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
  level: number;
  parent: string | null;
  path: string[];
  productDimensionsRequired: boolean;
  attributes: CategoryAttribute[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  __v: number;
}