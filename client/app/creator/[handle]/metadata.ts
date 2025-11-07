// SEO Metadata for creator pages
// This file can be used to generate metadata for creator pages
// Note: In Next.js App Router, metadata should be exported from the page or layout file

export function generateCreatorMetadata(storefront: any, handle: string) {
  const pageTitle = storefront 
    ? `${storefront.displayName} - Sports Picks | Lineup` 
    : 'Creator Profile | Lineup'
  
  const pageDescription = storefront?.description || 
    storefront?.aboutText || 
    `Subscribe to ${storefront?.displayName || 'this creator'}'s premium sports picks on Lineup`
  
  const ogImage = storefront?.bannerImage || storefront?.logoImage || ''

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: typeof window !== 'undefined' ? window.location.href : '',
      type: 'profile',
      images: ogImage ? [ogImage] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: ogImage ? [ogImage] : [],
    },
  }
}

