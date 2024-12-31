import mongoose from "mongoose";
import { Course } from "./models/course.model.js";
import { User } from "./models/user.model.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const sampleCourses = [
    {
        courseTitle: "Complete MERN Stack Development Bootcamp",
        subTitle: "Learn full-stack web development with MERN stack",
        description: "Comprehensive course covering MongoDB, Express.js, React.js, and Node.js",
        category: "mern stack development",
        courseLevel: "Beginner",
        coursePrice: 99.99,
        courseThumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Advanced JavaScript Masterclass",
        subTitle: "Master JavaScript programming with advanced concepts",
        description: "Deep dive into JavaScript including ES6+, async programming, and design patterns",
        category: "javascript",
        courseLevel: "Advance",
        coursePrice: 79.99,
        courseThumbnail: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Python for Data Science",
        subTitle: "Learn Python for data analysis and visualization",
        description: "Comprehensive course on Python, NumPy, Pandas, and data visualization",
        category: "data science",
        courseLevel: "Medium",
        coursePrice: 89.99,
        courseThumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Next.js Full Stack Development",
        subTitle: "Build modern web applications with Next.js",
        description: "Learn to build full-stack applications using Next.js, React, and MongoDB",
        category: "nextjs",
        courseLevel: "Medium",
        coursePrice: 129.99,
        courseThumbnail: "https://images.unsplash.com/photo-1591267990532-e5bdb1b0ceb8?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Frontend Development Fundamentals",
        subTitle: "Master modern frontend development",
        description: "Learn HTML, CSS, JavaScript, and React for building beautiful user interfaces",
        category: "frontend development",
        courseLevel: "Beginner",
        coursePrice: 69.99,
        courseThumbnail: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Backend Development with Node.js",
        subTitle: "Build scalable backend services",
        description: "Learn Node.js, Express.js, and MongoDB for backend development",
        category: "backend development",
        courseLevel: "Medium",
        coursePrice: 89.99,
        courseThumbnail: "https://images.unsplash.com/photo-1619410283995-43d9134e7656?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Python Programming Masterclass",
        subTitle: "Become a Python expert",
        description: "Comprehensive Python programming from basics to advanced concepts",
        category: "python",
        courseLevel: "Beginner",
        coursePrice: 79.99,
        courseThumbnail: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    },
    {
        courseTitle: "Docker for Developers",
        subTitle: "Learn container technology",
        description: "Master Docker for modern application deployment",
        category: "docker",
        courseLevel: "Medium",
        coursePrice: 69.99,
        courseThumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=800&auto=format&fit=crop&q=60",
        isPublished: true
    }
];

const seedDB = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Course.deleteMany({});
        await User.deleteMany({ role: 'instructor' });
        console.log('Cleared existing data');

        // Create instructor
        const hashedPassword = await bcrypt.hash('password123', 10);
        const instructor = await User.create({
            name: 'John Doe',
            email: 'instructor@example.com',
            password: hashedPassword,
            role: 'instructor'
        });
        console.log('Created instructor user');

        // Add courses with instructor
        const coursesWithCreator = sampleCourses.map(course => ({
            ...course,
            creator: instructor._id
        }));

        await Course.insertMany(coursesWithCreator);
        console.log('Sample courses added successfully');

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDB();
