import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Creating meaningful sample blogs...');

  // Find the first user to act as the author
  const user = await prisma.user.findFirst({
    select: { id: true }
  });
  
  if (!user) {
    console.error('No users found in the database. Cannot create sample blogs.');
    return;
  }

  const sampleBlogs = [
    {
      title: "The Future of Web Development: What to Expect in 2026",
      content: "<h2>Web Development is Evolving Rapidly</h2><p>As we navigate through 2026, the landscape of web development continues to shift. We are seeing a massive surge in AI-assisted coding, new frameworks that blur the line between frontend and backend, and an increased focus on WebAssembly.</p><p>Key trends include:</p><ul><li>Server-side rendering becoming the default</li><li>AI-driven UI generation</li><li>Edge computing taking over traditional server deployments</li></ul><p>Stay tuned as we explore these topics in depth over the coming weeks!</p>",
      coverImage: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      published: true,
      authorId: user.id
    },
    {
      title: "Mastering React Server Components",
      content: "<h2>Understanding the Paradigm Shift</h2><p>React Server Components (RSC) represent one of the most significant changes to the React ecosystem since Hooks. By moving components that don't need interactivity to the server, we can dramatically reduce bundle sizes and improve performance.</p><p>In this post, we'll break down how RSCs work under the hood and when you should use them versus traditional client components.</p><h3>The Benefits:</h3><ul><li>Zero bundle size impact</li><li>Direct access to backend resources</li><li>Automatic code splitting</li></ul>",
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
      published: true,
      authorId: user.id
    },
    {
      title: "Building Scalable Architectures with PostgreSQL and Prisma",
      content: "<h2>A Match Made in Heaven</h2><p>When building modern full-stack applications, choosing the right database and ORM is crucial. PostgreSQL remains the undisputed king of open-source relational databases, and Prisma has revolutionized how TypeScript developers interact with their data.</p><p>We will dive into advanced Prisma schema design, handling migrations in production, and optimizing queries for scale.</p>",
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
      published: true,
      authorId: user.id
    }
  ];

  for (const blog of sampleBlogs) {
    await prisma.blog.create({
      data: blog
    });
    console.log(`Created sample blog: "${blog.title}"`);
  }

  console.log('Finished creating sample blogs.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
