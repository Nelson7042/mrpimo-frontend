import React from 'react';
import { ProductInfo } from './Preview';
import { useCategories } from '@/hooks/queries';
import ICategory from '@/types/category.type';

const CategoryInfo = ({ subCategory }: { subCategory?: string }) => {
  const { data } = useCategories();
  const categories = data?.categories || [];
  console.log("Categories:", categories);
  console.log("SubCategory:", subCategory);
  
  // Find category based on the subcategory name
  const category = React.useMemo(() => {
    if (!subCategory || !categories) return null;
    console.log("I got here")
    
    return categories.find((cat: ICategory) => 
      cat.name === subCategory || 
      cat.attributes?.some((attr: any) => attr.name === subCategory)
    );
  }, [subCategory, categories]);

  if (!category) {
    return (
      <ProductInfo
        title={"Category"}
        value={"Not specified"}
      />
    );
  }

  return (
    <>
      <ProductInfo
        title={"Category"}
        value={category.name}
      />
      {/* <ProductInfo
        title={"Category Path"}
        value={category.path?.length ? category.path.join(' > ') : category.name}
      /> */}
    </>
  );
};

export default CategoryInfo;