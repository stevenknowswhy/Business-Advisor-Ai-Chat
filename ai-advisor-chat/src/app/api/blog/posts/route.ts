import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import { type BlogPost } from '@/types/blog';

// Mock blog posts data
const mockBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI Career Guidance',
    slug: 'future-of-ai-career-guidance',
    content: '# The Future of AI Career Guidance\n\nArtificial Intelligence is revolutionizing how we approach career development...',
    excerpt: 'Discover how AI is transforming career guidance and what it means for professionals seeking personalized advice.',
    featuredImage: '/images/blog/ai-career-guidance.jpg',
    author: {
      id: 'author1',
      name: 'Dr. Sarah Chen',
      avatar: '/images/authors/sarah-chen.jpg'
    },
    category: {
      id: 'ai-advisors',
      name: 'AI Advisors',
      slug: 'ai-advisors',
      description: 'Posts about AI-powered advisory systems',
      color: '#3B82F6'
    },
    tags: ['AI', 'Career Guidance', 'Future Trends', 'Technology'],
    status: 'published',
    publishedAt: new Date('2024-01-15'),
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
    seoTitle: 'The Future of AI Career Guidance - Trends and Predictions',
    seoDescription: 'Explore how artificial intelligence is reshaping career guidance and professional development.',
    readTime: 8,
    likes: 245,
    views: 1520,
    isFeatured: true
  },
  {
    id: '2',
    title: '5 Ways AI Advisors Can Transform Your Business Strategy',
    slug: 'ai-advisors-business-strategy',
    content: '# 5 Ways AI Advisors Can Transform Your Business Strategy\n\nIn today\'s rapidly evolving business landscape...',
    excerpt: 'Learn how AI-powered advisors can provide data-driven insights to revolutionize your business strategy.',
    author: {
      id: 'author2',
      name: 'Michael Rodriguez',
      avatar: '/images/authors/michael-rodriguez.jpg'
    },
    category: {
      id: 'business',
      name: 'Business',
      slug: 'business',
      description: 'Business strategy and management insights',
      color: '#F59E0B'
    },
    tags: ['Business Strategy', 'AI', 'Data Analytics', 'Management'],
    status: 'published',
    publishedAt: new Date('2024-01-12'),
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-12'),
    readTime: 6,
    likes: 189,
    views: 980
  },
  {
    id: '3',
    title: 'Machine Learning in Professional Development',
    slug: 'machine-learning-professional-development',
    content: '# Machine Learning in Professional Development\n\nProfessional development is being transformed by machine learning...',
    excerpt: 'Understanding how machine learning algorithms are personalizing professional development paths.',
    author: {
      id: 'author3',
      name: 'Prof. Emily Watson',
      avatar: '/images/authors/emily-watson.jpg'
    },
    category: {
      id: 'education',
      name: 'Education',
      slug: 'education',
      description: 'Educational technology and learning methods',
      color: '#8B5CF6'
    },
    tags: ['Machine Learning', 'Professional Development', 'Education', 'AI'],
    status: 'published',
    publishedAt: new Date('2024-01-10'),
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
    readTime: 10,
    likes: 156,
    views: 720
  }
];

export async function GET(request: NextRequest) {
  let userId;
  try {
    const auth = getAuth(request);
    userId = auth.userId;
  } catch (error) {
    // Continue without authentication for public blog access
    console.log('Authentication not available during build or for public access');
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const author = searchParams.get('author');
    const featured = searchParams.get('featured') === 'true';
    const limit = searchParams.get('limit');

    let filteredPosts = [...mockBlogPosts];

    // Apply filters
    if (category) {
      filteredPosts = filteredPosts.filter(post => post.category.id === category);
    }

    if (tag) {
      filteredPosts = filteredPosts.filter(post => post.tags.includes(tag));
    }

    if (author) {
      filteredPosts = filteredPosts.filter(post => post.author.id === author);
    }

    if (featured) {
      filteredPosts = filteredPosts.filter(post => post.isFeatured);
    }

    // Sort by publish date (newest first)
    filteredPosts.sort((a, b) =>
      new Date(b.publishedAt || b.createdAt).getTime() -
      new Date(a.publishedAt || a.createdAt).getTime()
    );

    // Apply limit
    if (limit) {
      filteredPosts = filteredPosts.slice(0, parseInt(limit));
    }

    return NextResponse.json({
      success: true,
      posts: filteredPosts,
      total: filteredPosts.length
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch blog posts' }
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  let userId;
  try {
    const auth = getAuth(request);
    userId = auth.userId;
  } catch (error) {
    console.log('Authentication not available during build or configuration missing');
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE', message: 'Authentication service unavailable' }
      },
      { status: 503 }
    );
  }

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required to create posts' }
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    // In a real implementation, you would create a new blog post in your database
    // For now, we'll just return a success response

    return NextResponse.json({
      success: true,
      message: 'Blog post created successfully',
      postId: 'new-post-id'
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create blog post' }
      },
      { status: 500 }
    );
  }
}