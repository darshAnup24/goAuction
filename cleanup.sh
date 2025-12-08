#!/bin/bash

# GoCart E-commerce to Auction Cleanup Script
# This script safely removes old e-commerce pages and components

echo "🧹 GoCart Cleanup - E-commerce to Auction Migration"
echo "===================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Function to safely delete with confirmation
safe_delete() {
    local path=$1
    local description=$2
    
    if [ -e "$path" ]; then
        echo -e "${YELLOW}Found: $description${NC}"
        echo "   Path: $path"
        read -p "   Delete? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf "$path"
            echo -e "${GREEN}   ✅ Deleted${NC}"
        else
            echo -e "${YELLOW}   ⏭️  Skipped${NC}"
        fi
        echo ""
    else
        echo -e "   ℹ️  Not found: $path (already deleted or doesn't exist)"
        echo ""
    fi
}

echo "Step 1: Creating Backup"
echo "----------------------"
read -p "Create backup branch 'backup-before-cleanup'? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git checkout -b backup-before-cleanup 2>/dev/null || echo "Branch already exists or not a git repo"
    git add . 2>/dev/null
    git commit -m "Backup before cleanup" 2>/dev/null
    git checkout main 2>/dev/null || git checkout master 2>/dev/null
    echo -e "${GREEN}✅ Backup created${NC}"
else
    echo -e "${YELLOW}⏭️  Skipped backup${NC}"
fi
echo ""

echo "Step 2: Deleting E-commerce Pages"
echo "----------------------------------"

# Delete cart
safe_delete "app/(public)/cart" "Shopping Cart pages"

# Delete old product pages
safe_delete "app/(public)/product" "Old Product detail pages"

# Delete shop pages
safe_delete "app/(public)/shop" "Old Shop/Browse pages"

# Delete demo pages
safe_delete "app/(public)/auction-card-demo" "Auction Card Demo page"
safe_delete "app/(public)/socket-demo" "Socket Demo page"

# Optional deletions
echo "Optional Pages (consider your needs):"
safe_delete "app/(public)/create-store" "Create Store page"
safe_delete "app/(public)/pricing" "Pricing page"
safe_delete "app/(public)/loading" "Loading test page"

echo ""
echo "Step 3: Store Management Decision"
echo "----------------------------------"
echo "You have both /dashboard and /store for seller management."
echo "Recommendation: Use unified /dashboard and delete /store"
echo ""
safe_delete "app/store" "Store management pages (seller dashboard)"

echo ""
echo "Step 4: Deleting E-commerce Components"
echo "---------------------------------------"

cd components 2>/dev/null || { echo "Components directory not found"; exit 1; }

# Delete product components
safe_delete "ProductCard.jsx" "Old Product Card component"
safe_delete "ProductDescription.jsx" "Product Description component"
safe_delete "ProductDetails.jsx" "Product Details component"

# Delete e-commerce marketing components
safe_delete "BestSelling.jsx" "Best Selling Products component"
safe_delete "LatestProducts.jsx" "Latest Products component"
safe_delete "CategoriesMarquee.jsx" "Categories Marquee component"
safe_delete "OurSpec.jsx" "Our Specifications component"
safe_delete "Counter.jsx" "Quantity Counter component"

echo ""
echo "Optional Components (review before deleting):"
safe_delete "Banner.jsx" "Banner component"
safe_delete "Hero.jsx" "Hero component"
safe_delete "Newsletter.jsx" "Newsletter component"
safe_delete "Title.jsx" "Title component"
safe_delete "OrderItem.jsx" "Order Item component"
safe_delete "OrderSummary.jsx" "Order Summary component"

cd ..

echo ""
echo "Step 5: Checking for Broken References"
echo "---------------------------------------"
echo "Searching for references to deleted pages..."
echo ""

echo "🔍 References to /shop:"
grep -r "/shop" app/ components/ 2>/dev/null | head -n 5 || echo "   None found"
echo ""

echo "🔍 References to /cart:"
grep -r "/cart" app/ components/ 2>/dev/null | head -n 5 || echo "   None found"
echo ""

echo "🔍 References to /product/:"
grep -r '"/product/' app/ components/ 2>/dev/null | head -n 5 || echo "   None found"
echo ""

echo "🔍 References to ProductCard:"
grep -r "ProductCard" app/ components/ 2>/dev/null | head -n 5 || echo "   None found"
echo ""

echo "=========================================="
echo "✅ Cleanup Complete!"
echo "=========================================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Update route references:"
echo "   - Find: /shop → Replace: /listings"
echo "   - Find: /cart → Replace: (remove or watchlist)"
echo "   - Find: /product/ → Replace: /listings/"
echo ""
echo "2. Update Navbar links:"
echo "   - 'Shop' → 'Auctions'"
echo "   - Link to /listings instead of /shop"
echo ""
echo "3. Test your app:"
echo "   npm run build"
echo ""
echo "4. If you see errors, check:"
echo "   grep -r 'COMPONENT_NAME' app/ components/"
echo ""
echo "5. Commit your changes:"
echo "   git add ."
echo "   git commit -m 'Cleanup: Remove e-commerce pages, keep auction features'"
echo ""
echo "📖 For detailed instructions, see: CLEANUP_GUIDE.md"
echo ""
