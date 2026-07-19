          import RecommendedProductCard from '@/components/products/RecommendedProductCard'
import { Product } from '@/utils/types'
import { Suspense } from 'react'
import BrandSkeleton from './brand-skeleton'

function ProductSlide({products}:{products:Product[]}) {
  return (
    <div>
                     <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4  xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
        <Suspense
          fallback={
            <div className="col-span-full grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4  xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {[...Array(6)].map((_, i) => (
                <BrandSkeleton key={i} />
              ))}
            </div>
          }
        >
          {products?.slice(0, 10)?.map((product: Product) => (
            <RecommendedProductCard key={product.id} product={product} />
          ))}
        </Suspense>
      </div>
    </div>
  )
}

export default ProductSlide