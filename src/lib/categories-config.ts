import kids from "@/assets/kids.png";
import headphone from "@/assets/headphone.png";
import health from "@/assets/health.png";
import jewelry from "@/assets/jewlrey.png";
import gaming from "@/assets/gaming.png";
import furniture from "@/assets/furniture.png";
import books from "@/assets/books.png";
import automobile from "@/assets/automobile.png";
import camera from "@/assets/camera.png";
import electronics from "@/assets/electronics.png";
import garden from "@/assets/garden.png";
import computer from "@/assets/computer.png";
import grocery from "@/assets/groceries.png";
import kitchen from "@/assets/kitchen.png";
import music from "@/assets/musicInstrument.png";
import officeSupplies from "@/assets/officeSupplies.png";
import fashion from "@/assets/fashion.png";
import sports from "@/assets/sport.png";
import dumbell from "@/assets/dumbell.png";
import phone from "@/assets/phone.png";
import { StaticImageData } from "next/image";

export interface CategoryFilter {
  id: string;
  name: string;
  type: "checkbox" | "radio" | "range" | "dropdown";
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

export interface CategoryConfig {
  id: string;
  name: string;
  image: StaticImageData;
  description: string;
  filters: CategoryFilter[];
  sortOptions: string[];
  priceRanges: Array<{ label: string; min: number; max: number }>;
}

export const categoriesConfig: Record<string, CategoryConfig> = {
    
  "sports-fitness": {
    id: "sports-fitness",
    name: "Sports & Fitness",
    image: sports,
    description: "Sporting goods, fitness gear and equipment for all levels",
    filters: [
      {
        id: "equipment-type",
        name: "Equipment Type",
        type: "checkbox",
        options: [
          "Treadmills",
          "Bicycles",
          "Football",
          "Yoga Mats",
          "Boxing Gear",
        ],
      },
      {
        id: "brand",
        name: "Brand",
        type: "checkbox",
        options: ["Nike", "Adidas", "Reebok", "Under Armour", "Puma"],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Newest",
    ],
    priceRanges: [
      { label: "Under ₦20,000", min: 0, max: 20000 },
      { label: "₦20k - ₦50k", min: 20000, max: 50000 },
      { label: "₦50k - ₦150k", min: 50000, max: 150000 },
      { label: "Above ₦150k", min: 150000, max: 1000000 },
    ],
  },

  "fitness-gear": {
    id: "fitness-gear",
    name: "Fitness Gear",
    image: dumbell,
    description: "Home and gym equipment to stay fit and healthy",
    filters: [
      {
        id: "gear-type",
        name: "Gear Type",
        type: "checkbox",
        options: [
          "Dumbbells",
          "Kettlebells",
          "Benches",
          "Resistance Bands",
          "Jump Ropes",
        ],
      },
      {
        id: "weight-range",
        name: "Weight Range",
        type: "range",
        min: 1,
        max: 100,
        step: 1,
      },
    ],
    sortOptions: ["Best Sellers", "Price: Low to High", "Newest", "Weight"],
    priceRanges: [
      { label: "Under ₦10,000", min: 0, max: 10000 },
      { label: "₦10k - ₦30k", min: 10000, max: 30000 },
      { label: "₦30k - ₦70k", min: 30000, max: 70000 },
      { label: "Above ₦70k", min: 70000, max: 500000 },
    ],
  },

  "office-supplies": {
    id: "office-supplies",
    name: "Office Supplies",
    image: officeSupplies,
    description: "Desks, chairs, printers, and everything you need for work",
    filters: [
      {
        id: "type",
        name: "Type",
        type: "checkbox",
        options: ["Desk", "Chair", "Printer", "Stationery", "Cabinets"],
      },
      {
        id: "brand",
        name: "Brand",
        type: "checkbox",
        options: ["HP", "Canon", "Logitech", "Brother", "3M"],
      },
    ],
    sortOptions: ["Best Sellers", "Price: Low to High", "Newest"],
    priceRanges: [
      { label: "Under ₦25,000", min: 0, max: 25000 },
      { label: "₦25k - ₦75k", min: 25000, max: 75000 },
      { label: "₦75k - ₦150k", min: 75000, max: 150000 },
      { label: "Above ₦150k", min: 150000, max: 1000000 },
    ],
  },

  groceries: {
    id: "groceries",
    name: "Groceries",
    image: grocery,
    description: "Daily essentials, packaged food, beverages and more",
    filters: [
      {
        id: "category",
        name: "Category",
        type: "checkbox",
        options: [
          "Beverages",
          "Snacks",
          "Grains",
          "Cooking Oil",
          "Cleaning Supplies",
        ],
      },
    ],
    sortOptions: ["Most Popular", "Price: Low to High", "Brand"],
    priceRanges: [
      { label: "Under ₦5,000", min: 0, max: 5000 },
      { label: "₦5k - ₦10k", min: 5000, max: 10000 },
      { label: "₦10k - ₦20k", min: 10000, max: 20000 },
      { label: "Above ₦20k", min: 20000, max: 100000 },
    ],
  },

  "kitchen-appliances": {
    id: "kitchen-appliances",
    name: "Kitchen Appliances",
    image: kitchen,
    description: "Cookers, blenders, microwaves and kitchen essentials",
    filters: [
      {
        id: "appliance-type",
        name: "Appliance Type",
        type: "checkbox",
        options: ["Blender", "Microwave", "Gas Cooker", "Kettle", "Oven"],
      },
    ],
    sortOptions: ["Most Popular", "Price: Low to High", "Newest"],
    priceRanges: [
      { label: "Under ₦30,000", min: 0, max: 30000 },
      { label: "₦30k - ₦70k", min: 30000, max: 70000 },
      { label: "₦70k - ₦150k", min: 70000, max: 150000 },
      { label: "Above ₦150k", min: 150000, max: 800000 },
    ],
  },

  "musical-instruments": {
    id: "musical-instruments",
    name: "Musical Instruments",
    image: music,
    description: "Guitars, keyboards, drums and professional gear",
    filters: [
      {
        id: "instrument-type",
        name: "Instrument Type",
        type: "checkbox",
        options: ["Guitar", "Keyboard", "Drums", "Violin", "Microphone"],
      },
    ],
    sortOptions: ["Best Sellers", "Newest", "Price: Low to High"],
    priceRanges: [
      { label: "Under ₦50,000", min: 0, max: 50000 },
      { label: "₦50k - ₦150k", min: 50000, max: 150000 },
      { label: "₦150k - ₦300k", min: 150000, max: 300000 },
      { label: "Above ₦300k", min: 300000, max: 2000000 },
    ],
  },

  cameras: {
    id: "cameras",
    name: "Cameras",
    image: camera,
    description: "Professional cameras, lenses, and accessories",
    filters: [
      {
        id: "camera-type",
        name: "Camera Type",
        type: "checkbox",
        options: ["DSLR", "Mirrorless", "Point & Shoot", "Action Cam"],
      },
      {
        id: "brand",
        name: "Brand",
        type: "checkbox",
        options: ["Canon", "Nikon", "Sony", "Fujifilm", "GoPro"],
      },
    ],
    sortOptions: ["Newest", "Price: Low to High", "Brand"],
    priceRanges: [
      { label: "Under ₦100,000", min: 0, max: 100000 },
      { label: "₦100k - ₦300k", min: 100000, max: 300000 },
      { label: "₦300k - ₦700k", min: 300000, max: 700000 },
      { label: "Above ₦700k", min: 700000, max: 3000000 },
    ],
  },

  "kids-toys": {
    id: "kids-toys",
    name: "Kids & Toys",
    image: kids,
    description: "Toys, clothing, and learning tools for kids of all ages",
    filters: [
      {
        id: "age-group",
        name: "Age Group",
        type: "checkbox",
        options: ["0-2", "3-5", "6-8", "9-12"],
      },
      {
        id: "type",
        name: "Type",
        type: "checkbox",
        options: ["Toys", "Clothing", "Books", "Learning Tools"],
      },
    ],
    sortOptions: ["Most Popular", "Age Group", "Price: Low to High"],
    priceRanges: [
      { label: "Under ₦10,000", min: 0, max: 10000 },
      { label: "₦10k - ₦30k", min: 10000, max: 30000 },
      { label: "₦30k - ₦60k", min: 30000, max: 60000 },
      { label: "Above ₦60k", min: 60000, max: 500000 },
    ],
  },

  headphones: {
    id: "headphones",
    name: "Headphones",
    image: headphone,
    description: "Wired and wireless headphones, earbuds and accessories",
    filters: [
      {
        id: "type",
        name: "Type",
        type: "checkbox",
        options: [
          "Over-Ear",
          "In-Ear",
          "Wireless",
          "Noise Cancelling",
          "Gaming",
        ],
      },
      {
        id: "brand",
        name: "Brand",
        type: "checkbox",
        options: ["Sony", "JBL", "Apple", "Samsung", "Beats", "Anker"],
      },
    ],
    sortOptions: ["Most Popular", "Price: Low to High", "Brand"],
    priceRanges: [
      { label: "Under ₦20,000", min: 0, max: 20000 },
      { label: "₦20k - ₦50k", min: 20000, max: 50000 },
      { label: "₦50k - ₦100k", min: 50000, max: 100000 },
      { label: "Above ₦100k", min: 100000, max: 500000 },
    ],
  },

  "health-care": {
    id: "health-care",
    name: "Health & Care",
    image: health,
    description: "Supplements, personal care and wellness essentials",
    filters: [
      {
        id: "type",
        name: "Type",
        type: "checkbox",
        options: ["Vitamins", "First Aid", "Skincare", "Haircare", "Devices"],
      },
    ],
    sortOptions: ["Most Popular", "Price: Low to High", "Newest"],
    priceRanges: [
      { label: "Under ₦10,000", min: 0, max: 10000 },
      { label: "₦10k - ₦30k", min: 10000, max: 30000 },
      { label: "₦30k - ₦70k", min: 30000, max: 70000 },
      { label: "Above ₦70k", min: 70000, max: 300000 },
    ],
  },

  "jewelry-accessories": {
    id: "jewelry-accessories",
    name: "Jewelry & Accessories",
    image: jewelry,
    description: "Elegant jewelry, watches and fashion accessories",
    filters: [
      {
        id: "type",
        name: "Type",
        type: "checkbox",
        options: ["Watches", "Necklaces", "Earrings", "Bracelets", "Rings"],
      },
      {
        id: "gender",
        name: "For",
        type: "radio",
        options: ["Men", "Women", "Unisex"],
      },
    ],
    sortOptions: ["Best Sellers", "Price: Low to High", "Newest"],
    priceRanges: [
      { label: "Under ₦20,000", min: 0, max: 20000 },
      { label: "₦20k - ₦50k", min: 20000, max: 50000 },
      { label: "₦50k - ₦100k", min: 50000, max: 100000 },
      { label: "Above ₦100k", min: 100000, max: 500000 },
    ],
  },

  "phones-tablets": {
    id: "phones-tablets",
    name: "Phones & Tablets",
    image: phone,
    description: "Latest smartphones, tablets and mobile accessories",
    filters: [
      {
        id: "brands",
        name: "Brands",
        type: "checkbox",
        options: [
          "Apple",
          "Samsung",
          "Google",
          "OnePlus",
          "Xiaomi",
          "Huawei",
          "Nokia",
          "Sony",
          "LG",
          "Motorola",
        ],
      },
      {
        id: "storage",
        name: "Storage",
        type: "checkbox",
        options: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"],
      },
      {
        id: "ram",
        name: "RAM",
        type: "checkbox",
        options: ["4GB", "6GB", "8GB", "12GB", "16GB", "24GB"],
      },
      {
        id: "condition",
        name: "Condition",
        type: "radio",
        options: ["New", "Refurbished", "Used"],
      },
      {
        id: "screen-size",
        name: "Screen Size",
        type: "range",
        min: 4,
        max: 15,
        step: 0.1,
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Newest",
      "Customer Rating",
      "Brand",
    ],
    priceRanges: [
      { label: "Under ₦50,000", min: 0, max: 50000 },
      { label: "₦50k - ₦100k", min: 50000, max: 100000 },
      { label: "₦100k - ₦300k", min: 100000, max: 300000 },
      { label: "₦300k - ₦500k", min: 300000, max: 500000 },
      { label: "Above ₦500k", min: 500000, max: 2000000 },
    ],
  },
  electronics: {
    id: "electronics",
    name: "Electronics",
    image: electronics,
    description: "TVs, audio systems, gaming consoles and electronic gadgets",
    filters: [
      {
        id: "brands",
        name: "Brands",
        type: "checkbox",
        options: [
          "Sony",
          "Samsung",
          "LG",
          "Panasonic",
          "TCL",
          "Hisense",
          "Philips",
          "Sharp",
        ],
      },
      {
        id: "type",
        name: "Product Type",
        type: "checkbox",
        options: [
          "Smart TV",
          "Gaming Console",
          "Sound System",
          "Headphones",
          "Speakers",
          "Cameras",
        ],
      },
      {
        id: "screen-size",
        name: "Screen Size (TV)",
        type: "checkbox",
        options: ['32"', '43"', '50"', '55"', '65"', '75"', '85"'],
      },
      {
        id: "resolution",
        name: "Resolution",
        type: "checkbox",
        options: ["HD", "Full HD", "4K", "8K"],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Brand",
      "Screen Size",
    ],
    priceRanges: [
      { label: "Under ₦100,000", min: 0, max: 100000 },
      { label: "₦100k - ₦300k", min: 100000, max: 300000 },
      { label: "₦300k - ₦500k", min: 300000, max: 500000 },
      { label: "₦500k - ₦1M", min: 500000, max: 1000000 },
      { label: "Above ₦1M", min: 1000000, max: 5000000 },
    ],
  },
  fashion: {
    id: "fashion",
    name: "Fashion",
    image: fashion,

    description: "Clothing, shoes, accessories and fashion items",
    filters: [
      {
        id: "category",
        name: "Category",
        type: "checkbox",
        options: [
          "Men's Clothing",
          "Women's Clothing",
          "Kids' Clothing",
          "Shoes",
          "Bags",
          "Accessories",
        ],
      },
      {
        id: "brands",
        name: "Brands",
        type: "checkbox",
        options: [
          "Nike",
          "Adidas",
          "Zara",
          "H&M",
          "Gucci",
          "Prada",
          "Louis Vuitton",
          "Versace",
        ],
      },
      {
        id: "size",
        name: "Size",
        type: "checkbox",
        options: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
      },
      {
        id: "color",
        name: "Color",
        type: "checkbox",
        options: [
          "Black",
          "White",
          "Red",
          "Blue",
          "Green",
          "Yellow",
          "Pink",
          "Purple",
          "Brown",
          "Gray",
        ],
      },
      {
        id: "material",
        name: "Material",
        type: "checkbox",
        options: [
          "Cotton",
          "Polyester",
          "Wool",
          "Silk",
          "Leather",
          "Denim",
          "Linen",
        ],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Newest",
      "Brand",
      "Customer Rating",
    ],
    priceRanges: [
      { label: "Under ₦10,000", min: 0, max: 10000 },
      { label: "₦10k - ₦25k", min: 10000, max: 25000 },
      { label: "₦25k - ₦50k", min: 25000, max: 50000 },
      { label: "₦50k - ₦100k", min: 50000, max: 100000 },
      { label: "Above ₦100k", min: 100000, max: 500000 },
    ],
  },
  "computer-laptop": {
    id: "computer-laptop",
    name: "Computer & Laptop",
    image: computer,

    description: "Laptops, desktops, accessories and computer components",
    filters: [
      {
        id: "brands",
        name: "Brands",
        type: "checkbox",
        options: [
          "Apple",
          "Dell",
          "HP",
          "Lenovo",
          "Asus",
          "Acer",
          "MSI",
          "Razer",
          "Microsoft",
        ],
      },
      {
        id: "type",
        name: "Type",
        type: "checkbox",
        options: [
          "Laptop",
          "Desktop",
          "Gaming PC",
          "All-in-One",
          "Mini PC",
          "Workstation",
        ],
      },
      {
        id: "processor",
        name: "Processor",
        type: "checkbox",
        options: [
          "Intel Core i3",
          "Intel Core i5",
          "Intel Core i7",
          "Intel Core i9",
          "AMD Ryzen 3",
          "AMD Ryzen 5",
          "AMD Ryzen 7",
          "AMD Ryzen 9",
        ],
      },
      {
        id: "ram",
        name: "RAM",
        type: "checkbox",
        options: ["4GB", "8GB", "16GB", "32GB", "64GB"],
      },
      {
        id: "storage",
        name: "Storage",
        type: "checkbox",
        options: [
          "256GB SSD",
          "512GB SSD",
          "1TB SSD",
          "2TB SSD",
          "1TB HDD",
          "2TB HDD",
        ],
      },
      {
        id: "screen-size",
        name: "Screen Size",
        type: "checkbox",
        options: ['13"', '14"', '15"', '16"', '17"', '21"', '24"', '27"'],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Performance",
      "Brand",
      "Screen Size",
    ],
    priceRanges: [
      { label: "Under ₦200,000", min: 0, max: 200000 },
      { label: "₦200k - ₦500k", min: 200000, max: 500000 },
      { label: "₦500k - ₦1M", min: 500000, max: 1000000 },
      { label: "₦1M - ₦2M", min: 1000000, max: 2000000 },
      { label: "Above ₦2M", min: 2000000, max: 5000000 },
    ],
  },
  furniture: {
    id: "furniture",
    name: "Furniture",
    image: furniture,

    description: "Home and office furniture, decor and furnishings",
    filters: [
      {
        id: "category",
        name: "Category",
        type: "checkbox",
        options: [
          "Sofa & Chairs",
          "Tables",
          "Beds",
          "Storage",
          "Office Furniture",
          "Outdoor Furniture",
        ],
      },
      {
        id: "material",
        name: "Material",
        type: "checkbox",
        options: [
          "Wood",
          "Metal",
          "Plastic",
          "Glass",
          "Fabric",
          "Leather",
          "Rattan",
        ],
      },
      {
        id: "room",
        name: "Room",
        type: "checkbox",
        options: [
          "Living Room",
          "Bedroom",
          "Dining Room",
          "Office",
          "Kitchen",
          "Bathroom",
          "Outdoor",
        ],
      },
      {
        id: "style",
        name: "Style",
        type: "checkbox",
        options: [
          "Modern",
          "Traditional",
          "Contemporary",
          "Vintage",
          "Industrial",
          "Scandinavian",
        ],
      },
      {
        id: "color",
        name: "Color",
        type: "checkbox",
        options: [
          "Brown",
          "Black",
          "White",
          "Gray",
          "Beige",
          "Blue",
          "Red",
          "Green",
        ],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Newest",
      "Customer Rating",
    ],
    priceRanges: [
      { label: "Under ₦50,000", min: 0, max: 50000 },
      { label: "₦50k - ₦150k", min: 50000, max: 150000 },
      { label: "₦150k - ₦300k", min: 150000, max: 300000 },
      { label: "₦300k - ₦500k", min: 300000, max: 500000 },
      { label: "Above ₦500k", min: 500000, max: 2000000 },
    ],
  },
  automobile: {
    id: "automobile",
    name: "Automobile",
    image: automobile,

    description: "Cars, motorcycles, auto parts and accessories",
    filters: [
      {
        id: "type",
        name: "Vehicle Type",
        type: "checkbox",
        options: [
          "Cars",
          "SUVs",
          "Trucks",
          "Motorcycles",
          "Bicycles",
          "Auto Parts",
          "Accessories",
        ],
      },
      {
        id: "brands",
        name: "Brands",
        type: "checkbox",
        options: [
          "Toyota",
          "Honda",
          "Mercedes",
          "BMW",
          "Audi",
          "Ford",
          "Nissan",
          "Hyundai",
          "Kia",
        ],
      },
      {
        id: "fuel-type",
        name: "Fuel Type",
        type: "checkbox",
        options: ["Petrol", "Diesel", "Electric", "Hybrid", "CNG"],
      },
      {
        id: "transmission",
        name: "Transmission",
        type: "checkbox",
        options: ["Manual", "Automatic", "CVT"],
      },
      {
        id: "year",
        name: "Year",
        type: "range",
        min: 2000,
        max: 2025,
        step: 1,
      },
      {
        id: "condition",
        name: "Condition",
        type: "radio",
        options: ["New", "Used", "Certified Pre-owned"],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Year",
      "Mileage",
      "Brand",
    ],
    priceRanges: [
      { label: "Under ₦1M", min: 0, max: 1000000 },
      { label: "₦1M - ₦3M", min: 1000000, max: 3000000 },
      { label: "₦3M - ₦5M", min: 3000000, max: 5000000 },
      { label: "₦5M - ₦10M", min: 5000000, max: 10000000 },
      { label: "Above ₦10M", min: 10000000, max: 50000000 },
    ],
  },
  books: {
    id: "books",
    name: "Books",
    image: books,

    description: "Books, e-books, educational materials and stationery",
    filters: [
      {
        id: "category",
        name: "Category",
        type: "checkbox",
        options: [
          "Fiction",
          "Non-Fiction",
          "Educational",
          "Children's Books",
          "Comics",
          "Magazines",
          "E-books",
        ],
      },
      {
        id: "genre",
        name: "Genre",
        type: "checkbox",
        options: [
          "Romance",
          "Mystery",
          "Science Fiction",
          "Fantasy",
          "Biography",
          "History",
          "Self-Help",
          "Business",
        ],
      },
      {
        id: "language",
        name: "Language",
        type: "checkbox",
        options: [
          "English",
          "French",
          "Spanish",
          "German",
          "Italian",
          "Portuguese",
          "Arabic",
        ],
      },
      {
        id: "format",
        name: "Format",
        type: "checkbox",
        options: ["Hardcover", "Paperback", "E-book", "Audiobook"],
      },
      {
        id: "condition",
        name: "Condition",
        type: "radio",
        options: ["New", "Like New", "Good", "Fair"],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Newest",
      "Author",
      "Customer Rating",
    ],
    priceRanges: [
      { label: "Under ₦2,000", min: 0, max: 2000 },
      { label: "₦2k - ₦5k", min: 2000, max: 5000 },
      { label: "₦5k - ₦10k", min: 5000, max: 10000 },
      { label: "₦10k - ₦20k", min: 10000, max: 20000 },
      { label: "Above ₦20k", min: 20000, max: 100000 },
    ],
  },
  gaming: {
    id: "gaming",
    name: "Gaming",
    image: gaming,

    description: "Gaming consoles, games, accessories and gaming gear",
    filters: [
      {
        id: "platform",
        name: "Platform",
        type: "checkbox",
        options: [
          "PlayStation 5",
          "Xbox Series X/S",
          "Nintendo Switch",
          "PC",
          "Mobile",
          "VR",
        ],
      },
      {
        id: "type",
        name: "Product Type",
        type: "checkbox",
        options: [
          "Consoles",
          "Games",
          "Controllers",
          "Headsets",
          "Keyboards",
          "Mice",
          "Chairs",
        ],
      },
      {
        id: "genre",
        name: "Game Genre",
        type: "checkbox",
        options: [
          "Action",
          "Adventure",
          "RPG",
          "Sports",
          "Racing",
          "Strategy",
          "Simulation",
          "Horror",
        ],
      },
      {
        id: "brands",
        name: "Brands",
        type: "checkbox",
        options: [
          "Sony",
          "Microsoft",
          "Nintendo",
          "Razer",
          "Logitech",
          "SteelSeries",
          "Corsair",
          "HyperX",
        ],
      },
      {
        id: "condition",
        name: "Condition",
        type: "radio",
        options: ["New", "Like New", "Good", "Fair"],
      },
    ],
    sortOptions: [
      "Most Popular",
      "Price: Low to High",
      "Price: High to Low",
      "Newest",
      "Brand",
      "Platform",
    ],
    priceRanges: [
      { label: "Under ₦10,000", min: 0, max: 10000 },
      { label: "₦10k - ₦50k", min: 10000, max: 50000 },
      { label: "₦50k - ₦100k", min: 50000, max: 100000 },
      { label: "₦100k - ₦300k", min: 100000, max: 300000 },
      { label: "Above ₦300k", min: 300000, max: 1000000 },
    ],
  },
};

// Sample products for each category
export const categoryProducts: Record<string, any[]> = {
  "phones-tablets": [
    {
      id: "1",
      name: "Samsung Galaxy S24 Ultra 256GB",
      condition: "New",
      price: 450000,
      originalPrice: 500000,
      rating: 5,
      reviews: 234,
      image: "/images/tv.png",
      badge: "10% OFF",
      brand: "Samsung",
      storage: "256GB",
      ram: "12GB",
      screenSize: 6.8,
    },

    {
      id: "2",
      name: "iPhone 15 Pro Max 512GB",
      condition: "New",
      price: 650000,
      rating: 5,
      reviews: 189,
      image: "/images/tv.png",
      badge: "NEW",
      brand: "Apple",
      storage: "512GB",
      ram: "8GB",
      screenSize: 6.7,
    },
    {
      id: "3",
      name: "Google Pixel 8 Pro 128GB",
      condition: "Refurbished",
      price: 280000,
      originalPrice: 350000,
      rating: 4,
      reviews: 156,
      image: "/images/tv.png",
      badge: "20% OFF",
      brand: "Google",
      storage: "128GB",
      ram: "12GB",
      screenSize: 6.7,
    },
  ],
  electronics: [
    {
      id: "1",
      name: 'Samsung 65" 4K Smart TV',
      condition: "New",
      price: 850000,
      rating: 4,
      reviews: 89,
      image: "/images/tv.png",
      brand: "Samsung",
      type: "Smart TV",
      screenSize: '65"',
      resolution: "4K",
    },
    {
      id: "2",
      name: "Sony PlayStation 5 Console",
      condition: "New",
      price: 320000,
      rating: 5,
      reviews: 245,
      image: "/images/tv.png",
      badge: "HOT",
      brand: "Sony",
      type: "Gaming Console",
    },
  ],
  fashion: [
    {
      id: "1",
      name: "Nike Air Max 270 Sneakers",
      condition: "New",
      price: 45000,
      rating: 4,
      reviews: 123,
      image: "/images/tv.png",
      brand: "Nike",
      category: "Shoes",
      size: "42",
      color: "Black",
      material: "Synthetic",
    },
    {
      id: "2",
      name: "Zara Men's Casual Shirt",
      condition: "New",
      price: 15000,
      rating: 4,
      reviews: 67,
      image: "/images/tv.png",
      brand: "Zara",
      category: "Men's Clothing",
      size: "L",
      color: "Blue",
      material: "Cotton",
    },
  ],
  "computer-laptop": [
    {
      id: "1",
      name: 'MacBook Pro 16" M3 Max',
      condition: "New",
      price: 1200000,
      rating: 5,
      reviews: 78,
      image: "/images/tv.png",
      brand: "Apple",
      type: "Laptop",
      processor: "M3 Max",
      ram: "32GB",
      storage: "1TB SSD",
      screenSize: '16"',
    },
    {
      id: "2",
      name: "Dell XPS 13 Intel i7",
      condition: "New",
      price: 450000,
      rating: 4,
      reviews: 134,
      image: "/images/tv.png",
      brand: "Dell",
      type: "Laptop",
      processor: "Intel Core i7",
      ram: "16GB",
      storage: "512GB SSD",
      screenSize: '13"',
    },
  ],
  furniture: [
    {
      id: "1",
      name: "Modern 3-Seater Sofa",
      condition: "New",
      price: 180000,
      rating: 4,
      reviews: 45,
      image: "/images/tv.png",
      category: "Sofa & Chairs",
      material: "Fabric",
      room: "Living Room",
      style: "Modern",
      color: "Gray",
    },
  ],
  automobile: [
    {
      id: "1",
      name: "2022 Toyota Camry LE",
      condition: "Used",
      price: 8500000,
      rating: 4,
      reviews: 23,
      image: "/images/tv.png",
      brand: "Toyota",
      type: "Cars",
      fuelType: "Petrol",
      transmission: "Automatic",
      year: 2022,
    },
  ],
  books: [
    {
      id: "1",
      name: "The Psychology of Money",
      condition: "New",
      price: 8500,
      rating: 5,
      reviews: 156,
      image: "/images/tv.png",
      category: "Non-Fiction",
      genre: "Business",
      language: "English",
      format: "Paperback",
    },
  ],
  gaming: [
    {
      id: "1",
      name: "PlayStation 5 DualSense Controller",
      condition: "New",
      price: 35000,
      rating: 5,
      reviews: 234,
      image: "/images/tv.png",
      platform: "PlayStation 5",
      type: "Controllers",
      brand: "Sony",
    },
  ],
};
