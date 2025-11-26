import React from 'react'
import Header from './Header'
import MarketplaceSection from './Hero'
import BestDeals from './BestDeals'
import ShopCategoriesComponent from './ByCategory'
import ComputerAccessories from './ComputerAccessories'
import FeaturedProducts from './FeaturedProduct'
import CustomerReviews from './Review'
import Cta from './Cta'
import Footer from './Footer'
import MobileNavigation from '../MobileNavigation'

const Homepage = () => {
  return (
    <div className="font-roboto min-h-screen">
      <Header />
      <main className="pb-16 md:pb-0">
        <MarketplaceSection />
        <BestDeals />
        <ShopCategoriesComponent />
        <FeaturedProducts />
        <ComputerAccessories />
        <CustomerReviews />
        <Cta />
      </main>
      <Footer />
      <MobileNavigation />
    </div>
  )
}

export default Homepage