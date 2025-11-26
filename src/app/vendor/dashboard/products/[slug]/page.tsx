"use client"


import React from 'react'
import ProductDetail from './(components)/ProductDetail'
import { useParams } from 'next/navigation';

  

const page = () => {
  const params = useParams();
  const slug = params.slug as string;

  return (
    <div className="p-2 sm:p-4 md:p-4 lg:p-10 h-full bg-gray-100">
      <ProductDetail slug={slug} />
    </div>
  )
}

export default page